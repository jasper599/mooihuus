import { NextResponse } from "next/server";
import { getListings, getPayments, getEmails, getUser, getListing } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TIJDELIJK leesvenster — gated met DIAG2_KEY. Na gebruik verwijderen.
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!process.env.DIAG2_KEY || key !== process.env.DIAG2_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const kolibri = getListings()
    .filter((l) => l.source === "kolibri")
    .map((l) => ({ titel: l.titel, externalId: l.externalId, status: l.status, ownerId: l.ownerId }));

  const pays = getPayments()
    .filter((p) => p.soort === "advertentie" || p.soort === "makelaar-factuur" || p.soort === "verlenging")
    .map((p) => ({
      factuurnummer: p.factuurnummer,
      soort: p.soort,
      woning: getListing(p.listingId)?.titel ?? p.listingId,
      bedrag: p.bedrag,
      status: p.status,
      aangemaakt: p.aangemaakt,
      betaler: getUser(p.userId)?.email ?? p.userId,
    }));

  const mails = getEmails()
    .filter((e) => e.soort === "welkom" || e.soort === "factuur")
    .slice(0, 15)
    .map((e) => ({ aan: e.aan, onderwerp: e.onderwerp, datum: e.datum }));

  return NextResponse.json({
    ok: true,
    nu: new Date().toISOString(),
    kolibriListings: kolibri,
    advertentieEnMakelaarPayments: pays,
    recenteMails: mails,
  });
}
