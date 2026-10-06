import { NextResponse } from "next/server";
import { verwerkMakelaarFacturatie } from "@/lib/facturatie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Automatische jaarfacturatie + offline-sweep voor makelaarskantoren die via een
// feed (Kolibri/Realworks) adverteren. De logica zit in lib/facturatie.ts en
// draait ook automatisch in de interne scheduler; dit endpoint is er om 'm
// handmatig/extern te kunnen aanroepen.
//
// Staat standaard UIT. Aanzetten met env FACTURATIE_AUTO=1. Respijttermijn via
// FACTURATIE_OFFLINE_DAGEN (standaard 14). Aanroepen: GET /api/cron/facturatie?key=CRON_SECRET
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const res = await verwerkMakelaarFacturatie();
  return NextResponse.json({ ok: true, ...res });
}

export async function POST(req: Request) {
  return GET(req);
}
