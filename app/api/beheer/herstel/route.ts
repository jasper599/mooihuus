import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, getListings, herstelListingRaw } from "@/lib/db";
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

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  let toegestaan = false;
  if (secret && key === secret) toegestaan = true;
  if (!toegestaan) {
    const s = await getServerSession(authOptions);
    if ((s?.user as any)?.rol === "beheerder") toegestaan = true;
  }
  if (!toegestaan) return NextResponse.json({ error: "Geen toegang." }, { status: 401 });

  const id = url.searchParams.get("id") || "li-5980";
  const doRestore = url.searchParams.get("restore") === "1";

  const dbHas = !!getListing(id);
  const eigen = getListings().filter((l) => String(l.id).startsWith("li-")).map((l) => l.id);

  // Volume-signaal: staan de foto-uploads er nog, en hoe oud zijn ze?
  const uploadsDir = path.join(DATA_DIR, "uploads");
  const uploads: any = { exists: false, count: 0, oudste: null, nieuwste: null };
  try {
    const files = fs.readdirSync(uploadsDir);
    uploads.exists = true;
    uploads.count = files.length;
    const t = files.map((f) => { try { return fs.statSync(path.join(uploadsDir, f)).mtimeMs; } catch { return 0; } }).filter(Boolean);
    if (t.length) { uploads.oudste = new Date(Math.min(...t)).toISOString(); uploads.nieuwste = new Date(Math.max(...t)).toISOString(); }
  } catch { /* geen uploads-map */ }

  // Back-ups op het volume
  const backupsDir = path.join(DATA_DIR, "backups");
  let backups: string[] = [];
  try { backups = fs.readdirSync(backupsDir).filter((f) => f.startsWith("db-")).sort(); } catch { /* geen map */ }
  let backupMet: string | null = null;
  let backupRecord: any = null;
  for (const f of backups.slice().reverse()) {
    try {
      const j: any = JSON.parse(fs.readFileSync(path.join(backupsDir, f), "utf8"));
      const rec = (j.listings || []).find((l: any) => l.id === id);
      if (rec) { backupMet = f; backupRecord = rec; break; }
    } catch { /* corrupte back-up overslaan */ }
  }

  const pg = await pgRecord(id);

  let hersteld: any = null;
  if (doRestore) {
    const rec = (pg as any).record || backupRecord || null;
    if (!rec) hersteld = { ok: false, reden: "record niet gevonden in Postgres of back-ups" };
    else hersteld = { ok: true, toegevoegd: herstelListingRaw(rec), bron: (pg as any).record ? "postgres" : "backup" };
  }

  return NextResponse.json({
    id,
    DATA_DIR,
    PG_PRIMARY: process.env.PG_PRIMARY || null,
    dbJson: { heeftId: dbHas, aantalEigenLi: eigen.length, eigenIds: eigen.slice(0, 25) },
    uploadsVolume: uploads,
    backups: { aantal: backups.length, nieuwste: backups.slice(-1)[0] || null, backupMetId: backupMet, fotosInBackupRecord: backupRecord ? (backupRecord.fotos || []).length : null },
    postgres: { ok: (pg as any).ok, error: (pg as any).error || null, totaalWoningen: (pg as any).count ?? null, heeftRecord: !!(pg as any).record, fotosInRecord: (pg as any).record ? ((pg as any).record.fotos || []).length : null },
    hersteld,
  });
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }
