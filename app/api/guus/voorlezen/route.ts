import { NextResponse } from "next/server";
import { guusDagoverzicht, guusGesprokenTekst } from "@/lib/guus-overzicht";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gesproken Mooihuus-briefing voor Guus (de stem). Guus roept dit aan en leest
// de 'tekst' letterlijk voor. Afgeschermd met CRON_SECRET (key-param of header).
//   /api/guus/voorlezen?key=CRON_SECRET&uren=24
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
  return NextResponse.json({ ok: true, tekst: guusGesprokenTekst(o), sindsUren: o.sindsUren });
}

export async function POST(req: Request) {
  return GET(req);
}
