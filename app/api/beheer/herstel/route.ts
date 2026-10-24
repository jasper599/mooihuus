import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, getListings, getUsers, herstelListingRaw } from "@/lib/db";
import { pgUpsertListing } from "@/lib/pg-upsert";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

async function pgRecord(id: string) {
  try {
    const mod: any = await import("@prisma/client");
    const prisma = new mod.PrismaClient();
    const count = await prisma.listing.count();
    const row: any = await prisma.listing.findUnique({ where: { id } });
    await prisma.$disconnect().catch(() => {});
    return { ok: true, count, record: row?.data ?? null };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e).slice(0, 180) };
  }
}

async function toegang(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (secret && key === secret) return true;
  const s = await getServerSession(authOptions);
  return (s?.user as any)?.rol === "beheerder";
}

function fotosVanDag(dag: string): string[] {
  const uploadsDir = path.join(DATA_DIR, "uploads");
  try {
    const files = fs.readdirSync(uploadsDir);
    const met = files
      .map((f) => { let m = 0; try { m = fs.statSync(path.join(uploadsDir, f)).mtimeMs; } catch { /* */ } return { f, m }; })
      .filter((x) => x.m && new Date(x.m).toISOString().startsWith(dag))
      .sort((a, b) => a.m - b.m);
    return met.map((x) => "/api/foto/" + x.f);
  } catch { return []; }
}

// De verloren particuliere plaatsing van Monique van der Hoeven (Schoorl),
// opnieuw opgebouwd uit de vastgelegde advertentietekst + de foto's die nog op
// het volume staan. Nederlands als basistaal (EN/DE vertaalt de site zelf).
function bouwMoniqueRecord(): any {
  const titel = "Charmant vakantiehuis met rieten dak in Schoorl – Noord-Holland, vlak bij de Noordzee";
  const L = [
    titel, "",
    "GEEN VERHUURPLICHT | EIGEN GROND | PRIVÉ TOEVLUCHTSOORD", "",
    "Droomt u van een eigen vakantiehuis aan de Nederlandse Noordzeekust? Een plek waar u kunt genieten van de rust, door de duinen kunt wandelen, met de fiets naar zee kunt gaan en de dagelijkse beslommeringen achter u kunt laten?", "",
    "In het geliefde, kleinschalige vakantiepark in Schoorl verkopen wij ons liefdevol ingerichte, vrijstaande vakantiehuis met karakteristiek rieten dak.", "",
    "Het huis ligt midden in een prachtige groene omgeving, direct grenzend aan het indrukwekkende duingebied van Schoorl.", "",
    "HET VAKANTIEHUIS", "",
    "• Vrijstaand vakantiehuis met traditioneel rieten dak",
    "• Bouwjaar 2007",
    "• Ca. 57 m² woonoppervlak",
    "• 170 m² grond in volledig eigendom – geen erfpacht",
    "• 2 volwaardige slaapkamers",
    "• Lichte woonkamer met grote raampartijen",
    "• Moderne open keuken met inbouwapparatuur",
    "• Badkamer met inloopdouche",
    "• Apart toilet",
    "• Zonnige, beschutte tuin met terras",
    "• Praktische berging",
    "• Parkeergelegenheid bij het huis met eigen laadpunt voor de elektrische auto",
    "• Energielabel C",
    "• Verkoop inclusief inrichting en inventaris, met uitzondering van persoonlijke spullen", "",
    "DE LIGGING – SCHOORL, NOORD-HOLLAND", "",
    "Schoorl staat bekend om zijn indrukwekkende duinen, uitgestrekte bossen en prachtige fiets- en wandelpaden.", "",
    "Vanuit het vakantiehuis bereikt u de natuur vrijwel direct voor de deur. Het sfeervolle dorpscentrum van Schoorl is te voet bereikbaar. Ook de Noordzeekust, Bergen en andere mooie plaatsen in Noord-Holland liggen vlakbij.", "",
    "Hier kunt u in elk seizoen ontspannen – of het nu tijdens een strandwandeling is, een fietstocht of een gezellige avond op uw eigen terras.", "",
    "BIJZONDER INTERESSANT VOOR EIGEN GEBRUIK", "",
    "Voor het vakantiehuis geldt geen verhuurplicht.", "",
    "U bepaalt zelf wanneer u uw vakantie in Schoorl wilt doorbrengen. Professionele vakantieverhuur is in principe eveneens mogelijk, mits aan de betreffende voorwaarden wordt voldaan.", "",
    "Het huis is uitsluitend bestemd voor recreatief gebruik. Permanente bewoning is niet toegestaan.", "",
    "KOOPPRIJS EN KOSTEN", "",
    "Koopprijs: € 399.000, te vermeerderen met de Nederlandse kosten koper.", "",
    "Park-/servicekosten volgens de verkoopadvertentie: ca. € 260 per maand.", "",
    "INTERESSE?", "",
    "Wij ontvangen graag serieuze aanvragen. U ontvangt desgewenst meer informatie en kunt een bezichtigingsafspraak maken.", "",
    "Locatie: Oorsprongweg 8-0030, 1871 HA Schoorl, Noord-Holland.", "",
    "De verkoop en de bezichtigingen worden uitgevoerd in samenwerking met onze Nederlandse makelaar.",
  ];
  return {
    id: "li-5980", ownerId: "u-admin", source: "eigen", titel,
    type: "Vrijstaand vakantiehuis", doel: "koop", provincie: "Noord-Holland", park: "Scorleduyn",
    personen: 4, m2: 57, perceel: 170, bouwjaar: 2007, slaapkamers: 2,
    prijs: 399000, prijsSuffix: "k.k.", grond: "Eigen grond", energielabel: "C",
    omschrijving: L.join("\n"),
    fotos: fotosVanDag("2026-10-24"),
    uitjes: ["Klimduin", "De Berenkuil", "Strand Noordzee", "Fietsen", "Wandelen", "Bergen aan Zee"],
    status: "live", pakket: "Basis", kleur: 2, postcode: "1871HA",
    aangemaakt: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  if (!(await toegang(req))) return NextResponse.json({ error: "Geen toegang." }, { status: 401 });
  const url = new URL(req.url);

  // Eén-kliks herstel van de Schoorl-woning (via adresbalk, als beheerder).
  if (url.searchParams.get("rebuild") === "1") {
    const rec = bouwMoniqueRecord();
    const bestond = !!getListing(rec.id);
    const toegevoegd = herstelListingRaw(rec);
    await pgUpsertListing(rec);
    const naPg = await pgRecord(rec.id);
    return NextResponse.json({
      ok: true, actie: "rebuild", id: rec.id, bestondAl: bestond,
      toegevoegdAanDbJson: toegevoegd, aantalFotos: rec.fotos.length,
      inPostgresNa: !!(naPg as any).record,
      bekijk: "https://www.mooihuus.nl/aanbod/" + rec.id,
    });
  }

  // Scan de volume-back-ups op het verloren particuliere account (bv. Monique).
  // Alleen-lezen: parseert elke db-*.json en vist niet-beheer-gebruikers +
  // de betaling van li-5980 / factuur MH-2026-0009 eruit.
  if (url.searchParams.get("scanbackups") === "1") {
    const dir = path.join(DATA_DIR, "backups");
    let files: string[] = [];
    try { files = fs.readdirSync(dir).filter((f) => f.startsWith("db-") && f.endsWith(".json")).sort(); } catch { /* */ }
    const uit: any[] = [];
    for (const f of files) {
      try {
        const j: any = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        const users: any[] = Array.isArray(j.users) ? j.users : [];
        const particuliere = users
          .filter((u) => u && u.id !== "u-admin" && u.rol !== "beheerder")
          .map((u) => ({ id: u.id, email: u.email, naam: u.naam, telefoon: u.telefoon || null, plaats: u.plaats || null, type: u.type, rol: u.rol, aangemaakt: u.aangemaakt }));
        const pays: any[] = Array.isArray(j.payments) ? j.payments : [];
        const betaling = pays
          .filter((p) => p && (p.listingId === "li-5980" || p.factuurnummer === "MH-2026-0009"))
          .map((p) => ({ userId: p.userId, factuurnummer: p.factuurnummer, mollieId: p.mollieId || null, bedrag: p.bedrag }));
        const listings: any[] = Array.isArray(j.listings) ? j.listings : [];
        const li = listings.find((l) => l && l.id === "li-5980");
        uit.push({ bestand: f, aantalUsers: users.length, particuliere, li5980: li ? { ownerId: li.ownerId } : null, betaling });
      } catch (e: any) {
        uit.push({ bestand: f, error: String(e?.message || e).slice(0, 120) });
      }
    }
    return NextResponse.json({ ok: true, aantal: files.length, backups: uit });
  }

  const id = url.searchParams.get("id") || "li-5980";
  const dbHas = !!getListing(id);
  const eigen = getListings().filter((l) => String(l.id).startsWith("li-")).map((l) => l.id);
  const uploadsDir = path.join(DATA_DIR, "uploads");
  const uploads: any = { exists: false, count: 0 };
  try { uploads.exists = true; uploads.count = fs.readdirSync(uploadsDir).length; } catch { /* */ }
  const pg = await pgRecord(id);
  const body: any = {
    id, DATA_DIR, PG_PRIMARY: process.env.PG_PRIMARY || null,
    dbJson: { heeftId: dbHas, aantalEigenLi: eigen.length, eigenIds: eigen.slice(0, 25) },
    uploadsVolume: uploads,
    postgres: { ok: (pg as any).ok, totaalWoningen: (pg as any).count ?? null, heeftRecord: !!(pg as any).record },
  };
  if (url.searchParams.get("users") === "1") body.users = getUsers().map((u: any) => ({ id: u.id, email: u.email, naam: u.naam, rol: u.rol }));
  return NextResponse.json(body);
}

export async function POST(req: Request) {
  if (!(await toegang(req))) return NextResponse.json({ error: "Geen toegang." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const rec = b?.recreate;
  if (!rec || !rec.id || !rec.titel || !rec.ownerId) {
    return NextResponse.json({ error: "Geef een volledig 'recreate'-record mee (incl. id, titel, ownerId)." }, { status: 400 });
  }
  const bestond = !!getListing(rec.id);
  const toegevoegd = herstelListingRaw(rec);
  await pgUpsertListing(rec);
  const naPg = await pgRecord(rec.id);
  return NextResponse.json({ ok: true, id: rec.id, bestondAl: bestond, toegevoegdAanDbJson: toegevoegd, inPostgresNa: !!(naPg as any).record });
}
