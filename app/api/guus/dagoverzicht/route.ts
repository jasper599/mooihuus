import { NextResponse } from "next/server";
import { guusDagoverzicht } from "@/lib/guus-overzicht";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kort Mooihuus-dagoverzicht voor Max: hij haalt dit 's ochtends op en neemt de
// ene zin ("kort") mee in zijn briefing voor Jasper. Afgeschermd met CRON_SECRET.
function geautoriseerd(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-cron-key");
  return key === secret;
}

export async function GET(req: Request) {
  if (!geautoriseerd(req)) {
    return NextResponse.json({ ok: false, error: "Niet geautoriseerd." }, { status: 403 });
  }
  const url = new URL(req.url);
  const uren = Math.min(96, Math.max(1, Number(url.searchParams.get("uren")) || 24));
  const o = guusDagoverzicht(uren);
  return NextResponse.json({
    ok: true,
    kort: o.kort,
    aantallen: {
      aanvragen: o.aanvragen.length,
      plaatsingen: o.plaatsingen.length,
      tickets: o.tickets.length,
      mislukt: o.mislukt.length,
    },
  });
}
