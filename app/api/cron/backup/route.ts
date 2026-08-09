import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { maakBackup } from "@/lib/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dagelijkse database-back-up. Beveiligd met CRON_SECRET (of een ingelogde
// beheerder). Aanroepen: GET /api/cron/backup?key=CRON_SECRET
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-cron-key");

  let toegestaan = false;
  if (secret && key === secret) toegestaan = true;
  if (!toegestaan) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.rol === "beheerder") toegestaan = true;
  }
  if (!toegestaan) return NextResponse.json({ error: "Geen toegang." }, { status: 401 });

  const res = await maakBackup();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
