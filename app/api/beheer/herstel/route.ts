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

export async function GET(req: Request) {
  if (!(await toegang(req))) return NextResponse.json({ error: "Geen toegang." }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "li-5980";

  const dbHas = !!getListing(id);
  const eigen = getListings().filter((l) => String(l.id).startsWith("li-")).map((l) => l.id);

  const uploadsDir = path.join(DATA_DIR, "uploads");
  const uploads: any = { exists: false, count: 0, oudste: null, nieuwste: null, lijst: undefined };
  try {
    const files = fs.readdirSync(uploadsDir);
    uploads.exists = true;
    uploads.count = files.length;
    const met = files.map((f) => { let m = 0; try { m = fs.statSync(path.join(uploadsDir, f)).mtimeMs; } catch { /* */ } return { name: f, mtime: m }; });
    met.sort((a, b) => b.mtime - a.mtime);
    if (met.length) { uploads.nieuwste = new Date(met[0].mtime).toISOString(); uploads.oudste = new Date(met[met.length - 1].mtime).toISOString(); }
    if (url.searchParams.get("uploads") === "1") uploads.lijst = met.map((x) => ({ name: x.name, mtime: new Date(x.mtime).toISOString() }));
  } catch { /* geen uploads-map */ }

  const backupsDir = path.join(DATA_DIR, "backups");
  let backups: string[] = [];
  try { backups = fs.readdirSync(backupsDir).filter((f) => f.startsWith("db-")).sort(); } catch { /* */ }
  let backupMet: string | null = null;
  let backupRecord: any = null;
  for (const f of backups.slice().reverse()) {
    try {
      const j: any = JSON.parse(fs.readFileSync(path.join(backupsDir, f), "utf8"));
      const rec = (j.listings || []).find((l: any) => l.id === id);
      if (rec) { backupMet = f; backupRecord = rec; break; }
    } catch { /* */ }
  }

  const pg = await pgRecord(id);

  const body: any = {
    id, DATA_DIR, PG_PRIMARY: process.env.PG_PRIMARY || null,
    dbJson: { heeftId: dbHas, aantalEigenLi: eigen.length, eigenIds: eigen.slice(0, 25) },
    uploadsVolume: uploads,
    backups: { aantal: backups.length, nieuwste: backups.slice(-1)[0] || null, backupMetId: backupMet, fotosInBackupRecord: backupRecord ? (backupRecord.fotos || []).length : null },
    postgres: { ok: (pg as any).ok, error: (pg as any).error || null, totaalWoningen: (pg as any).count ?? null, heeftRecord: !!(pg as any).record, fotosInRecord: (pg as any).record ? ((pg as any).record.fotos || []).length : null },
  };
  if (url.searchParams.get("users") === "1") {
    body.users = getUsers().map((u: any) => ({ id: u.id, email: u.email, naam: u.naam, rol: u.rol, realtorId: u.realtorId || null }));
  }
  return NextResponse.json(body);
}

// Herstel: zet een volledig meegegeven woningrecord terug (insert in db.json met
// behoud van id) EN schrijf 'm direct naar Postgres, zodat 'ie blijvend is.
// Stuurt GEEN e-mails of meldingen — puur een stille insert.
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
