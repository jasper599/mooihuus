/**
 * Postgres-spiegel (Fase 1 van de migratie) — VOLLEDIG GEÏSOLEERD.
 *
 * db.json blijft in Fase 1 de bron van waarheid. Deze module doet niets anders
 * dan op de achtergrond een kopie van de data naar Postgres schrijven, zodat we
 * kunnen bewijzen dat Postgres exact meeloopt vóór we in Fase 2 omschakelen.
 *
 * Harde regels:
 *  - Leest de data via snapshotForMirror() (alleen-lezen). Raakt het schrijfpad
 *    van de app NOOIT aan.
 *  - Alles staat in try/catch. Een fout in de spiegel mag de app nooit raken —
 *    db.json draait gewoon door.
 *  - Draait alleen als DATABASE_URL gezet is. Zo niet: stil uit.
 */
import { snapshotForMirror } from "./db";

// Prisma-model (property op de client) + hoe we de rij-id bepalen.
// Exact dezelfde id-logica als scripts/migrate-to-postgres.ts, zodat de
// eenmalige migratie en de spiegel nooit dezelfde rij dubbel aanmaken.
const COLLECTIES: { veld: string; model: string; id: (e: any, i: number) => string }[] = [
  { veld: "users", model: "user", id: (e) => e.id },
  { veld: "listings", model: "listing", id: (e) => e.id },
  { veld: "leads", model: "lead", id: (e) => e.id },
  { veld: "payments", model: "payment", id: (e) => e.id },
  { veld: "emails", model: "email", id: (e) => e.id },
  { veld: "enquetes", model: "enquete", id: (e) => e.id },
  { veld: "huusmeesters", model: "huusmeester", id: (e) => e.id },
  { veld: "zoekopdrachten", model: "zoekopdracht", id: (e) => e.id },
  { veld: "reviews", model: "review", id: (e) => e.id },
  { veld: "partnerkliks", model: "partnerKlik", id: (e) => e.id },
  { veld: "pageviews", model: "pageview", id: (e) => e.id },
  { veld: "postcodegeo", model: "postcodeGeo", id: (e, i) => String(e.postcode ?? e.id ?? `pc-${i}`) },
  { veld: "nieuwsbrief", model: "nieuwsbriefLid", id: (e, i) => String(e.email ?? e.id ?? `nb-${i}`) },
  { veld: "socialPosts", model: "socialPost", id: (e) => e.id },
  { veld: "blogPosts", model: "blogPost", id: (e, i) => String(e.slug ?? e.id ?? `blog-${i}`) },
  { veld: "kortingscodes", model: "kortingscode", id: (e) => e.id },
];

const META_VELDEN = ["seq", "laatsteNieuwsbriefSlug", "laatsteMaandrapportMaand", "resetTokens", "aiStyling", "integraties"];

const CHUNK = 500;

let prisma: any = null;
let gestart = false;
let bezig = false;
let laatsteSync: { tijd: string | null; ok: boolean; fout: string | null; rijen: number } = {
  tijd: null, ok: false, fout: null, rijen: 0,
};

// Onthoudt per model wat we voor het laatst wegschreven (id -> JSON), zodat we
// per ronde alleen gewijzigde/nieuwe/verwijderde rijen aanraken.
const bekend: Record<string, Map<string, string>> = {};
function mapVoor(model: string): Map<string, string> {
  return bekend[model] || (bekend[model] = new Map());
}

function pgAan(): boolean {
  return !!process.env.DATABASE_URL;
}

// Prisma mapt een model (bv. User) op een tabel met exact dezelfde naam, en de
// camelCase client-property (user, partnerKlik, ...) heeft dezelfde letters —
// dus de tabelnaam is simpelweg de property met een hoofdletter voorop.
function tabelVoor(model: string): string {
  return model.charAt(0).toUpperCase() + model.slice(1);
}

let tabellenKlaar = false;
// Maakt de tabellen aan als ze nog niet bestaan (CREATE TABLE IF NOT EXISTS).
// Precies de vorm die het Prisma-schema verwacht (id TEXT pk, data JSONB,
// bijgewerkt timestamp). Zo hoeven we de Prisma-CLI niet bij elke boot te
// draaien — dat zou het opstarten van de live-app kunnen blokkeren.
async function ensureTabellen(): Promise<void> {
  if (tabellenKlaar || !prisma) return;
  for (const c of COLLECTIES) {
    const t = tabelVoor(c.model);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "${t}" ("id" TEXT PRIMARY KEY, "data" JSONB NOT NULL, "bijgewerkt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`
    );
  }
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "Meta" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL)`
  );
  tabellenKlaar = true;
}

export function pgMirrorStatus() {
  return {
    ingeschakeld: pgAan(),
    gestart,
    bezig,
    laatsteSync,
  };
}

/** Start de spiegel. Idempotent en nooit fataal. */
export async function initPgMirror(): Promise<void> {
  if (gestart || !pgAan()) return;
  gestart = true;
  try {
    const mod: any = await import("@prisma/client");
    const PrismaClient = mod.PrismaClient;
    prisma = new PrismaClient();
  } catch (e: any) {
    prisma = null;
    laatsteSync = { tijd: new Date().toISOString(), ok: false, fout: `init: ${e?.message || e}`, rijen: 0 };
    return;
  }
  // Eerste sync kort na opstart (geef de app rust om te booten), daarna periodiek.
  setTimeout(() => { void syncNaarPg(); }, 10000);
  setInterval(() => { void syncNaarPg(); }, 60000);
}

/** Schrijf de huidige momentopname naar Postgres. Alleen-gewijzigde rijen. */
export async function syncNaarPg(): Promise<void> {
  if (!prisma || bezig) return;
  bezig = true;
  let rijen = 0;
  try {
    await ensureTabellen();
    const db: any = snapshotForMirror();

    for (const c of COLLECTIES) {
      const arr: any[] = Array.isArray(db[c.veld]) ? db[c.veld] : [];
      const prev = mapVoor(c.model);
      const gezien = new Set<string>();
      const eersteKeer = prev.size === 0;

      // Eerste keer voor dit model: bulk-insert in brokken (veel sneller dan
      // rij-voor-rij upserten bij duizenden rijen).
      if (eersteKeer && arr.length > 0) {
        const data = arr.map((e, i) => {
          const id = String(c.id(e, i) ?? `auto-${c.veld}-${i}`);
          gezien.add(id);
          prev.set(id, JSON.stringify(e));
          return { id, data: e };
        });
        for (let i = 0; i < data.length; i += CHUNK) {
          await prisma[c.model].createMany({ data: data.slice(i, i + CHUNK), skipDuplicates: true });
          rijen += Math.min(CHUNK, data.length - i);
        }
        continue;
      }

      // Daarna: alleen nieuwe/gewijzigde rijen upserten.
      for (let i = 0; i < arr.length; i++) {
        const e = arr[i];
        const id = String(c.id(e, i) ?? `auto-${c.veld}-${i}`);
        gezien.add(id);
        const js = JSON.stringify(e);
        if (prev.get(id) === js) continue; // onveranderd
        await prisma[c.model].upsert({ where: { id }, create: { id, data: e }, update: { data: e } });
        prev.set(id, js);
        rijen++;
      }

      // Verwijderd in db.json -> ook uit Postgres halen.
      for (const id of Array.from(prev.keys())) {
        if (!gezien.has(id)) {
          await prisma[c.model].delete({ where: { id } }).catch(() => {});
          prev.delete(id);
          rijen++;
        }
      }
    }

    // Meta-velden (losse sleutel/waarde-rijen).
    const metaPrev = mapVoor("__meta");
    for (const k of META_VELDEN) {
      const v = db[k];
      if (v === undefined) continue;
      const js = JSON.stringify(v);
      if (metaPrev.get(k) === js) continue;
      await prisma.meta.upsert({ where: { key: k }, create: { key: k, value: v }, update: { value: v } });
      metaPrev.set(k, js);
      rijen++;
    }

    laatsteSync = { tijd: new Date().toISOString(), ok: true, fout: null, rijen };
  } catch (e: any) {
    // Nooit fataal — db.json blijft de bron van waarheid.
    laatsteSync = { tijd: new Date().toISOString(), ok: false, fout: `${e?.message || e}`.slice(0, 300), rijen };
    // eslint-disable-next-line no-console
    console.error("[pg-mirror] sync fout:", e?.message || e);
  } finally {
    bezig = false;
  }
}

/** Telt de rijen per model in Postgres (voor verificatie na een sync). */
export async function pgTellingen(): Promise<Record<string, number> | null> {
  if (!prisma) return null;
  const uit: Record<string, number> = {};
  try {
    await ensureTabellen();
    for (const c of COLLECTIES) {
      uit[c.veld] = await prisma[c.model].count();
    }
    uit["__meta"] = await prisma.meta.count();
  } catch (e: any) {
    return { _fout: -1 } as any;
  }
  return uit;
}
