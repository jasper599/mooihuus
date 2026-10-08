/**
 * Eenmalige data-migratie: leest de huidige data/db.json en schrijft alles naar
 * Postgres (zie prisma/schema.prisma). Draai dit ÉÉN keer bij de omschakeling,
 * ná `prisma db push` en met DATABASE_URL gezet.
 *
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-to-postgres.ts
 *
 * Idempotent: gebruikt upserts, dus nog een keer draaien kan geen kwaad.
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Collectie -> Prisma-model + hoe we de rij-id bepalen.
const COLLECTIES: { veld: string; model: keyof PrismaClient; id: (e: any, i: number) => string }[] = [
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

async function main() {
  if (!fs.existsSync(DB_FILE)) throw new Error(`db.json niet gevonden op ${DB_FILE}`);
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

  for (const c of COLLECTIES) {
    const arr: any[] = Array.isArray(db[c.veld]) ? db[c.veld] : [];
    let n = 0;
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i];
      const id = String(c.id(e, i) ?? `auto-${c.veld}-${i}`);
      // @ts-expect-error — dynamische modelnaam
      await prisma[c.model].upsert({ where: { id }, create: { id, data: e }, update: { data: e } });
      n++;
    }
    console.log(`${c.veld}: ${n} rijen`);
  }

  for (const k of META_VELDEN) {
    if (db[k] !== undefined) {
      await prisma.meta.upsert({ where: { key: k }, create: { key: k, value: db[k] }, update: { value: db[k] } });
    }
  }
  console.log("meta: klaar");
  console.log("✅ Migratie voltooid.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
