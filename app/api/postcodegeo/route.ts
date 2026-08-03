import { NextResponse } from "next/server";
import { getPostcodeGeoMap, setPostcodeGeo } from "@/lib/db";

export const runtime = "nodejs";

// GET: bekende postcode→coördinaten (cache) zodat de kaart niet opnieuw geocodeert.
export async function GET() {
  return NextResponse.json({ map: getPostcodeGeoMap() });
}

// POST: sla een (door de browser via PDOK) geocode-resultaat op. Server valideert
// dat het binnen Nederland ligt, zodat er geen onzin in de cache komt.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const pc = String(b.pc || "");
  const lat = Number(b.lat);
  const lon = Number(b.lon);
  if (!pc || !isFinite(lat) || !isFinite(lon)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ok = setPostcodeGeo(pc, lat, lon);
  return NextResponse.json({ ok });
}
