import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Facturatie voor makelaarskantoren loopt per woning via de normale advertentie-
// en verlengflow (lib/verlenging.ts), die dagelijks in de interne scheduler draait.
// Dit endpoint is daarom bewust een no-op; het blijft bestaan voor compatibiliteit.
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, bericht: "Per-woning facturatie loopt via de advertentie-/verlengflow." });
}

export async function POST(req: Request) {
  return GET(req);
}
