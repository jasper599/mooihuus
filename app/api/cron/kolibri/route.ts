import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncKolibri } from "@/lib/feed-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kolibri-koppeling (Wazzup Real Estate Connector) synchroniseren: actieve
// makelaars + hun panden ophalen en verwerken. Max ~2x per dag draaien.
// Beveiligd met CRON_SECRET (geplande taak) of een ingelogde beheerder.
// Aanroepen: GET /api/cron/kolibri?key=CRON_SECRET
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

  try {
    const res = await syncKolibri();
    return NextResponse.json({ ok: true, ...res });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Kolibri-sync mislukt." }, { status: 502 });
  }
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }
