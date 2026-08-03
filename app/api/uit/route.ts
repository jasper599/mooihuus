import { NextResponse } from "next/server";
import { partnerByNaam } from "@/lib/partners";
import { addPartnerklik } from "@/lib/db";

// Doorklik-teller voor partners. We sturen alleen door naar bekende
// partner-URL's (whitelist) — geen open redirect.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const naam = url.searchParams.get("partner") || "";
  const partner = partnerByNaam(naam);

  if (!partner) {
    // Onbekende partner → terug naar de Huusmeesters-pagina.
    return NextResponse.redirect(new URL("/huusmeesters", req.url));
  }

  try {
    addPartnerklik(partner.naam, partner.url);
  } catch {
    // tellen mag nooit de doorstuur blokkeren
  }
  return NextResponse.redirect(partner.url);
}
