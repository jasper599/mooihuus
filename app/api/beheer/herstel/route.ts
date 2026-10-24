import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, getListings, getUsers, getEmails, addUser, updateListing, herstelListingRaw } from "@/lib/db";
import { pgUpsertListing, pgUpsertUser } from "@/lib/pg-upsert";
import { renderEigenaarWoningLive, sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";
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

  // Zoek het verloren particuliere adres via de verstuurde/gelogde mails.
  // Alleen-lezen: huidige emails-collectie, de emails in de back-ups, én de
  // HTML-bestanden in data/outbox (preview-mails die niet verstuurd zijn).
  if (url.searchParams.get("scanmail") === "1") {
    const bekend = new Set([
      "beheer@mooihuus.nl", "info@mooihuus.nl", "noreply@mooihuus.nl", "facturen@mooihuus.nl",
      "jasper@luytenmakelaardij.nl", "info@luytenmakelaardij.nl",
      "advies@zorgwoning.nl", "kristof.meeuwes@telenet.be",
    ]);
    const boeiend = ["welkom", "betalingsbewijs", "factuur"];
    const re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

    const huidigeMails = getEmails()
      .filter((e) => boeiend.includes(e.soort))
      .map((e) => ({ aan: e.aan, soort: e.soort, onderwerp: e.onderwerp, via: e.verzondenVia, datum: e.datum }));

    const backupMails: any[] = [];
    try {
      const dir = path.join(DATA_DIR, "backups");
      for (const f of fs.readdirSync(dir).filter((x) => x.startsWith("db-") && x.endsWith(".json")).sort()) {
        try {
          const j: any = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
          const em: any[] = Array.isArray(j.emails) ? j.emails : [];
          const rel = em
            .filter((e) => e && boeiend.includes(e.soort) && e.aan && !bekend.has(String(e.aan).toLowerCase()))
            .map((e) => ({ aan: e.aan, soort: e.soort, datum: e.datum }));
          if (rel.length) backupMails.push({ bestand: f, mails: rel });
        } catch { /* */ }
      }
    } catch { /* */ }

    const outbox: any[] = [];
    try {
      const obdir = path.join(DATA_DIR, "outbox");
      for (const f of fs.readdirSync(obdir).filter((x) => x.endsWith(".html")).sort()) {
        try {
          const html = fs.readFileSync(path.join(obdir, f), "utf8");
          const adressen = Array.from(new Set((html.match(re) || []).map((x) => x.toLowerCase()))).filter((a) => !bekend.has(a));
          outbox.push({ bestand: f, adressen });
        } catch { /* */ }
      }
    } catch { /* */ }

    return NextResponse.json({ ok: true, huidigeMails, backupMails, outbox });
  }

  // Maak (indien nodig) het particuliere account van de eigenaar aan, koppel de
  // woning eraan en stuur optioneel de "je woning staat online"-mail. Idempotent:
  // bestaat het account al, dan wordt het hergebruikt. Met &mail=1 gaat de mail uit.
  if (url.searchParams.get("maakeigenaar") === "1") {
    const email = (url.searchParams.get("email") || "humanique@me.com").trim();
    const naam = url.searchParams.get("naam") || "Monique van der Hoeven";
    const listingId = url.searchParams.get("id") || "li-5980";

    let user = getUsers().find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    const aangemaakt = !user;
    if (!user) {
      user = addUser({ naam, email, wachtwoord: randomBytes(24).toString("hex"), type: "particulier" });
    }

    let ownerNa: string | null = null;
    const li = getListing(listingId);
    if (li && user) {
      updateListing(listingId, { ownerId: user.id });
      const na = getListing(listingId);
      if (na) { await pgUpsertListing(na); ownerNa = na.ownerId || null; }
    }
    if (user) await pgUpsertUser(user);

    let mailVia: string | null = null;
    if (url.searchParams.get("mail") === "1" && user && li) {
      const { onderwerp, html } = renderEigenaarWoningLive(user.naam, user.email, li.titel, li.id);
      const rec = await sendEmail({ aan: user.email, onderwerp, html, soort: "welkom" });
      mailVia = rec.verzondenVia;
    }

    return NextResponse.json({
      ok: true, actie: "maakeigenaar", userId: user?.id, email: user?.email, naam: user?.naam,
      accountAangemaakt: aangemaakt, woningGekoppeld: !!user && ownerNa === user.id, ownerNa,
      mailVerstuurd: mailVia, mailVia,
    });
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
