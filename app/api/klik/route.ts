import { NextResponse } from "next/server";
import { getListing, addPartnerklik } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Klik-teller voor externe (affiliate) verhuurwoningen. Telt de doorklik en
// stuurt door naar de partner-URL van de woning zélf — dus geen open redirect.
// Aanroep: GET /api/klik?id=<woning-id>
export function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const listing = getListing(id);
  if (!listing || !listing.externalUrl) {
    return NextResponse.redirect(new URL("/verhuur", req.url));
  }
  try {
    addPartnerklik(listing.bronLabel || listing.source || "Verhuurpartner", listing.externalUrl);
  } catch {
    // tellen mag de doorstuur nooit blokkeren
  }
  return NextResponse.redirect(listing.externalUrl);
}
