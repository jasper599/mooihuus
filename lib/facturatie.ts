import { getUser, getUsers, getListingsByOwner, getPayments, addPayment, updatePayment, updateListing } from "./db";
import { mollieEnabled, createMolliePayment } from "./mollie";
import { renderMakelaarFactuur, sendEmail } from "./email";
import { COMPANY } from "./company";
import { volumeKortingPct } from "./money";

// Makelaars publiceren met het Premiumpakket tegen een vast makelaarstarief
// van € 65 per object (instelbaar via env), mét de bekende volumekorting
// (vanaf 5 objecten 15%, vanaf 10 objecten 25%).
export function makelaarBasisTarief(): number {
  const v = Number(process.env.MAKELAAR_OBJECT_PRIJS);
  return isFinite(v) && v > 0 ? v : 65;
}
export function prijsPerObject(aantal = 1): number {
  const korting = volumeKortingPct(aantal);
  return Math.round(makelaarBasisTarief() * (1 - korting / 100) * 100) / 100;
}

// Objecten die we een makelaar in rekening brengen: hun live woningen die via
// een feed (Kolibri/Realworks) zijn gepubliceerd.
export function factureerbareObjecten(ownerId: string) {
  return getListingsByOwner(ownerId).filter(
    (l) => (l.status === "live" || l.status === "offline") && (l.source === "kolibri" || l.source === "realworks")
  );
}

function baseUrl(): string {
  return process.env.NEXTAUTH_URL || COMPANY.website;
}

// Maakt een factuur voor één makelaar/kantoor: telt de objecten, maakt een
// Mollie-betaallink en mailt de factuur met die link naar de makelaar.
export async function maakMakelaarFactuur(ownerId: string, stil = false): Promise<{
  ok: boolean;
  reden?: string;
  aantal?: number;
  bedrag?: number;
  betaalUrl?: string;
  factuurnummer?: string;
}> {
  const owner = getUser(ownerId);
  if (!owner) return { ok: false, reden: "Makelaar niet gevonden." };

  const objecten = factureerbareObjecten(ownerId);
  if (objecten.length === 0) return { ok: false, reden: "Geen factureerbare (feed-)objecten voor deze makelaar." };

  const prijs = prijsPerObject(objecten.length);
  const bedrag = Math.round(objecten.length * prijs * 100) / 100;
  const kantoor = owner.bedrijfsnaam || owner.naam;

  // Registreer de factuur als betaling (open).
  const payment = addPayment({
    listingId: `makelaar-${ownerId}`,
    userId: ownerId,
    pakket: "Premium",
    bedrag,
    status: "open",
    methode: "iDEAL",
    soort: "makelaar-factuur",
    aantalObjecten: objecten.length,
    omschrijving: `Jaaradvertenties Mooihuus — ${objecten.length} objecten (1 jaar)`,
  });

  // Mollie-betaallink (of simulatie zonder key).
  let betaalUrl = `${baseUrl()}/betaling/${payment.id}`;
  if (mollieEnabled()) {
    try {
      const { mollieId, checkoutUrl } = await createMolliePayment({
        bedrag,
        beschrijving: `Mooihuus advertenties — ${kantoor} (${objecten.length} objecten)`,
        redirectUrl: `${baseUrl()}/betaling/${payment.id}`,
        webhookUrl: `${baseUrl()}/api/webhook/mollie`,
      });
      updatePayment(payment.id, { mollieId });
      betaalUrl = checkoutUrl || betaalUrl;
    } catch {
      // val terug op interne betaalpagina
    }
  }

  // Factuur mailen met de betaallink erin.
  const updated = { ...payment, factuurnummer: payment.factuurnummer };
  const mail = renderMakelaarFactuur({
    kantoor,
    factuurnummer: updated.factuurnummer,
    objecten: objecten.map((o) => ({ titel: o.titel })),
    prijsPerObject: prijs,
    totaal: bedrag,
    betaalUrl,
  });
  if (!stil) {
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html });
    await sendEmail({ aan: COMPANY.email, onderwerp: `Kopie — ${mail.onderwerp}`, soort: "factuur", html: mail.html });
  }

  return { ok: true, aantal: objecten.length, bedrag, betaalUrl, factuurnummer: updated.factuurnummer };
}

// Losse factuur met een eigen bedrag + omschrijving (bijv. een eenmalige
// advertentie). Maakt een Mollie-betaallink en (optioneel) mailt de factuur.
export async function maakLosseFactuur(args: {
  ownerId: string;
  nettoBedrag: number; // bedrag excl. btw
  btw: boolean; // 21% btw toevoegen?
  omschrijving: string;
  mailen: boolean;
}): Promise<{ ok: boolean; reden?: string; bedrag?: number; betaalUrl?: string; factuurnummer?: string; paymentId?: string }> {
  const owner = getUser(args.ownerId);
  if (!owner) return { ok: false, reden: "Profiel niet gevonden." };
  const netto = Math.round(Number(args.nettoBedrag) * 100) / 100;
  if (!(netto > 0)) return { ok: false, reden: "Vul een geldig bedrag in." };
  const bedrag = args.btw ? Math.round(netto * 1.21 * 100) / 100 : netto;
  const kantoor = owner.bedrijfsnaam || owner.naam;
  const omschrijving = (args.omschrijving || "").trim() || "Advertentie op Mooihuus";

  const payment = addPayment({
    listingId: `factuur-${args.ownerId}`,
    userId: args.ownerId,
    pakket: "Premium",
    bedrag,
    status: "open",
    methode: "iDEAL",
    soort: "makelaar-factuur",
    omschrijving,
  });

  let betaalUrl = `${baseUrl()}/betaling/${payment.id}`;
  if (mollieEnabled()) {
    try {
      const { mollieId, checkoutUrl } = await createMolliePayment({
        bedrag,
        beschrijving: `Mooihuus — ${omschrijving} (${kantoor})`,
        redirectUrl: `${baseUrl()}/betaling/${payment.id}`,
        webhookUrl: `${baseUrl()}/api/webhook/mollie`,
      });
      updatePayment(payment.id, { mollieId });
      betaalUrl = checkoutUrl || betaalUrl;
    } catch {
      // val terug op de interne betaalpagina
    }
  }

  if (args.mailen) {
    const mail = renderMakelaarFactuur({
      kantoor,
      factuurnummer: payment.factuurnummer,
      objecten: [{ titel: omschrijving }],
      prijsPerObject: bedrag,
      totaal: bedrag,
      betaalUrl,
    });
    // Naar de betaler (het profiel) én een kopie naar Mooihuus zelf.
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html });
    await sendEmail({ aan: COMPANY.email, onderwerp: `Kopie — ${mail.onderwerp}`, soort: "factuur", html: mail.html });
  }

  return { ok: true, bedrag, betaalUrl, factuurnummer: payment.factuurnummer, paymentId: payment.id };
}

// Automatische jaarfacturatie + offline-sweep voor feed-kantoren (Kolibri/Realworks).
// Staat uit tenzij FACTURATIE_AUTO=1. Respijttermijn via FACTURATIE_OFFLINE_DAGEN (standaard 14).
export async function verwerkMakelaarFacturatie(): Promise<{ actief: boolean; gefactureerd: number; offline: number }> {
  if (process.env.FACTURATIE_AUTO !== "1") return { actief: false, gefactureerd: 0, offline: 0 };
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
    // Nieuw kantoor: eerst de welkomstmail, pas na 1 dag de facturatie-sweep.
    if (nu - Date.parse(u.aangemaakt) < 24 * 60 * 60 * 1000) continue;
    const betaaldTot = u.betaaldTot ? Date.parse(u.betaaldTot) : 0;
    if (betaaldTot && betaaldTot > nu) continue; // nog een jaar geldig
    const open = getPayments().filter(
      (p) => p.userId === u.id && p.soort === "makelaar-factuur" && p.status === "open"
    );
    if (open.length === 0) {
      try { await maakMakelaarFactuur(u.id); gefactureerd++; } catch { /* volgende run opnieuw */ }
      continue;
    }
    const oudste = Math.min(...open.map((p) => Date.parse(p.aangemaakt) || nu));
    if (nu - oudste > graceDagen * 24 * 60 * 60 * 1000) {
      for (const l of objecten) {
        if (l.status === "live") { updateListing(l.id, { status: "offline" }); offline++; }
      }
    }
  }
  return { actief: true, gefactureerd, offline };
}


// Per-woning advertentie-betaling voor een feed-woning (Kolibri). Maakt een
// 'advertentie'-betaling — zodat de bestaande betaal- en verlengflow (verlenging.ts)
// de woning daarna automatisch oppakt — plus een Mollie-betaallink.
// Prijs: het makelaarstarief per woning per jaar.
export async function maakWoningBetaling(
  ownerId: string,
  listing: { id: string; titel: string; pakket?: any }
): Promise<{ ok: boolean; betaalUrl?: string; bedrag?: number; paymentId?: string }> {
  const owner = getUser(ownerId);
  if (!owner) return { ok: false };
  const bedrag = makelaarBasisTarief();
  const payment = addPayment({
    listingId: listing.id,
    userId: ownerId,
    pakket: (listing.pakket as any) || "Premium",
    bedrag,
    status: "open",
    methode: "iDEAL",
    soort: "advertentie",
    omschrijving: `Jaaradvertentie Mooihuus — ${listing.titel}`,
  });
  let betaalUrl = `${baseUrl()}/betaling/${payment.id}`;
  if (mollieEnabled()) {
    try {
      const { mollieId, checkoutUrl } = await createMolliePayment({
        bedrag,
        beschrijving: `Mooihuus advertentie — ${listing.titel}`,
        redirectUrl: `${baseUrl()}/betaling/${payment.id}`,
        webhookUrl: `${baseUrl()}/api/webhook/mollie`,
      });
      updatePayment(payment.id, { mollieId });
      betaalUrl = checkoutUrl || betaalUrl;
    } catch {
      /* val terug op de interne betaalpagina */
    }
  }
  return { ok: true, betaalUrl, bedrag, paymentId: payment.id };
}
