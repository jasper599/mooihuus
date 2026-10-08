import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { snapshotForMirror } from "@/lib/db";
import { pgMirrorStatus, pgTellingen, syncNaarPg } from "@/lib/pg-mirror";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verificatie van de Postgres-spiegel (Fase 1). Vergelijkt de rij-aantallen in
// db.json met die in Postgres. Beveiligd met CRON_SECRET of een beheerder.
// Aanroepen: GET /api/cron/pg-status?key=CRON_SECRET  (&sync=1 forceert een sync)
const VELDEN = [
  "users", "listings", "leads", "payments", "emails", "enquetes", "huusmeesters",
  "zoekopdrachten", "reviews", "partnerkliks", "pageviews", "postcodegeo",
  "nieuwsbrief", "socialPosts", "blogPosts", "kortingscodes",
];

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

  if (url.searchParams.get("sync") === "1") {
    await syncNaarPg();
  }

  const db: any = snapshotForMirror();
  const jsonTelling: Record<string, number> = {};
  for (const v of VELDEN) jsonTelling[v] = Array.isArray(db[v]) ? db[v].length : 0;

  const pgTelling = await pgTellingen();

  // Verschillen tonen (db.json vs Postgres) — alles gelijk = spiegel klopt.
  const verschil: Record<string, { json: number; pg: number }> = {};
  if (pgTelling) {
    for (const v of VELDEN) {
      const j = jsonTelling[v] || 0;
      const p = (pgTelling as any)[v] || 0;
      if (j !== p) verschil[v] = { json: j, pg: p };
    }
  }

  return NextResponse.json({
    status: pgMirrorStatus(),
    jsonTelling,
    pgTelling,
    verschil,
    gelijk: pgTelling ? Object.keys(verschil).length === 0 : false,
  });
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }
