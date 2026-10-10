import { NextResponse } from "next/server";
import { syncBetalingen } from "@/lib/eboekhouden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Boekt betaalde Mooihuus-facturen naar e-Boekhouden (Huus B.V.).
// Beveiligd met CRON_SECRET. Standaard DRY-RUN (toont alleen wat er geboekt
// zou worden). Echt boeken: &dry=0 én de env EBOEKHOUDEN_MOOIHUUS_TOKEN gezet.
//   Preview : /api/eboekhouden/sync?key=CRON_SECRET
//   Boeken  : /api/eboekhouden/sync?key=CRON_SECRET&dry=0
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const dry = url.searchParams.get("dry") !== "0"; // standaard dry-run
  const limietRaw = Number(url.searchParams.get("limiet"));
  const limiet = Number.isFinite(limietRaw) && limietRaw > 0 ? limietRaw : undefined;
  try {
    const res = await syncBetalingen({ dry, limiet });
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
