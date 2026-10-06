import { NextResponse } from "next/server";
import { getUsers, getListingsByOwner, getPayments, updateListing } from "@/lib/db";
import { maakMakelaarFactuur } from "@/lib/facturatie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Automatische jaarfacturatie + offline-sweep voor makelaarskantoren die via
// een feed (Kolibri/Realworks) adverteren.
//
// Model: woningen staan meteen live; per kantoor gaat er een jaarfactuur uit;
// na betaling is het kantoor een jaar geldig (user.betaaldTot). Blijft een
// factuur na de respijttermijn onbetaald, dan gaan de woningen offline.
//
// Staat standaard UIT. Aanzetten met env FACTURATIE_AUTO=1 zodra het eerste
// echte kantoor via Kolibri binnen is. Respijttermijn via FACTURATIE_OFFLINE_DAGEN
// (standaard 14). Aanroepen: GET /api/cron/facturatie?key=CRON_SECRET
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (process.env.FACTURATIE_AUTO !== "1") {
    return NextResponse.json({ ok: true, actief: false, bericht: "FACTURATIE_AUTO staat uit." });
  }

  const graceDagen = Number(process.env.FACTURATIE_OFFLINE_DAGEN) || 14;
  const nu = Date.now();
  const kantoren = getUsers().filter((u) => u.type === "zakelijk" && !!u.realtorId);
  let gefactureerd = 0;
  let offline = 0;

  for (const u of kantoren) {
    const objecten = getListingsByOwner(u.id).filter(
      (l) => (l.source === "kolibri" || l.source === "realworks") && (l.status === "live" || l.status === "offline")
    );
    if (objecten.length === 0) continue;

    // Geef nieuwe kantoren eerst de welkomstmail; pas na 1 dag factureren.
    if (Date.now() - Date.parse(u.aangemaakt) < 24 * 60 * 60 * 1000) continue;

    const betaaldTot = u.betaaldTot ? Date.parse(u.betaaldTot) : 0;
    if (betaaldTot && betaaldTot > nu) continue; // nog een jaar geldig

    const open = getPayments().filter(
      (p) => p.userId === u.id && p.soort === "makelaar-factuur" && p.status === "open"
    );

    if (open.length === 0) {
      try {
        await maakMakelaarFactuur(u.id);
        gefactureerd++;
      } catch {
        /* factuur mislukt — volgende run probeert opnieuw */
      }
      continue;
    }

    const oudste = Math.min(...open.map((p) => Date.parse(p.aangemaakt) || nu));
    if (nu - oudste > graceDagen * 24 * 60 * 60 * 1000) {
      for (const l of objecten) {
        if (l.status === "live") {
          updateListing(l.id, { status: "offline" });
          offline++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, actief: true, gefactureerd, offline });
}
