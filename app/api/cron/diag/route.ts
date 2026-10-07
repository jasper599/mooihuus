import { NextResponse } from "next/server";
import { getUsers, getPayments, getListings, getEmails } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TIJDELIJK diagnose-endpoint — na gebruik verwijderen.
// Beveiligd met CRON_SECRET. Aanroepen: GET /api/cron/diag?key=CRON_SECRET
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!process.env.DIAG_KEY || key !== process.env.DIAG_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const kantoren = getUsers()
    .filter((u) => u.type === "zakelijk" && !!u.realtorId)
    .map((u) => ({
      id: u.id,
      bedrijfsnaam: u.bedrijfsnaam || u.naam,
      email: u.email,
      realtorId: u.realtorId,
      inlogMailGestuurd: (u as any).inlogMailGestuurd ?? null,
      welkomGestuurd: (u as any).welkomGestuurd ?? null,
      betaaldTot: (u as any).betaaldTot ?? null,
      aangemaakt: u.aangemaakt,
    }));

  const perRealtor: Record<string, number> = {};
  for (const k of kantoren) perRealtor[String(k.realtorId)] = (perRealtor[String(k.realtorId)] || 0) + 1;

  const makelaarPayments = getPayments()
    .filter((p) => p.soort === "advertentie" || p.soort === "makelaar-factuur" || p.soort === "verlenging")
    .map((p) => ({
      id: p.id,
      soort: p.soort,
      listingId: p.listingId,
      listingIds: (p as any).listingIds ?? null,
      userId: p.userId,
      bedrag: p.bedrag,
      status: p.status,
      aangemaakt: p.aangemaakt,
    }));

  const welkomMails = getEmails()
    .filter((e) => e.soort === "welkom")
    .slice(0, 40)
    .map((e) => ({ aan: e.aan, onderwerp: e.onderwerp, datum: e.datum, via: e.verzondenVia }));

  const kolibri = getListings().filter((l) => l.source === "kolibri");
  const kolibriPerStatus: Record<string, number> = {};
  for (const l of kolibri) kolibriPerStatus[l.status] = (kolibriPerStatus[l.status] || 0) + 1;

  return NextResponse.json({
    ok: true,
    nu: new Date().toISOString(),
    facturatieAuto: process.env.FACTURATIE_AUTO === "1",
    aantalKantoren: kantoren.length,
    kantorenPerRealtor: perRealtor,
    kantoren,
    aantalMakelaarPayments: makelaarPayments.length,
    makelaarPayments,
    aantalWelkomMails: getEmails().filter((e) => e.soort === "welkom").length,
    welkomMails,
    kolibriListings: kolibri.length,
    kolibriPerStatus,
  });
}
