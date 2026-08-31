import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lichtgewicht health-endpoint voor Railway en externe uptime-monitors.
// Doet bewust GEEN zwaar werk (geen feed-sync, geen groot databaseladen), zodat
// de healthcheck altijd snel antwoordt — ook als de homepage druk of groot is.
export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
