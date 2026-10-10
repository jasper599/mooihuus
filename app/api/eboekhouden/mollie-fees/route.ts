import { NextResponse } from "next/server";
import { leesMollieFacturen, mollieOrgTokenAanwezig } from "@/lib/mollie-facturen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fase 2 — toont Mollie's eigen fee-facturen (de kostenkant) zodat ze in
// e-Boekhouden geboekt kunnen worden. Read-only; vereist MOLLIE_ORG_TOKEN
// (Mollie access token met invoices.read). Beveiligd met CRON_SECRET.
//   /api/eboekhouden/mollie-fees?key=CRON_SECRET
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!mollieOrgTokenAanwezig()) {
    return NextResponse.json({
      ok: true,
      actief: false,
      bericht:
        "Zet MOLLIE_ORG_TOKEN (een Mollie access token met scope invoices.read) in de Mooihuus-variabelen om Mollie's fee-facturen te lezen.",
      facturen: [],
    });
  }
  try {
    const limit = Number(url.searchParams.get("limit")) || 25;
    const facturen = await leesMollieFacturen({ limit });
    return NextResponse.json({ ok: true, actief: true, aantal: facturen.length, facturen });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
