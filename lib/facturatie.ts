import { getUser, getUsers, getListingsByOwner, getPayments, addPayment, updatePayment, updateListing } from "./db";
import { mollieEnabled, createMolliePayment } from "./mollie";
import { renderMakelaarFactuur, sendEmail } from "./email";
import { COMPANY } from "./company";

// Makelaars publiceren met het Premiumpakket tegen een vast makelaarstarief
// van € 65 per object (instelbaar via env). Geen volumekorting: makelaars
// betalen per woning, dus een staffel heeft hier geen functie.
export function makelaarBasisTarief(): number {
  const v = Number(process.env.MAKELAAR_OBJECT_PRIJS);
  return isFinite(v) && v > 0 ? v : 65;
}
export function prijsPerObject(_aantal = 1): number {
  return makelaarBasisTarief();
}

// --- Lanceringskorting Kolibri -------------------------------------------
// Tijdelijke actie: objecten die via de Kolibri-koppeling binnenkomen krijgen
// t/m de einddatum een lager tarief (standaard EUR 55 i.p.v. EUR 65). De
// korting vervalt automatisch OP de einddatum. Alles instelbaar via env:
//   MAKELAAR_KOLIBRI_LANCERING_PRIJS  (default 55)
//   MAKELAAR_KOLIBRI_LANCERING_TOT    (default 2026-12-16, NL-tijd)
const KOLIBRI_LANCERING_TOT_DEFAULT = "2026-12-16";
export function kolibriLanceringTot(): Date {
  const s = process.env.MAKELAAR_KOLIBRI_LANCERING_TOT || KOLIBRI_LANCERING_TOT_DEFAULT;
  const d = new Date(`${s}T00:00:00+01:00`);
  return isNaN(d.getTime()) ? new Date(`${KOLIBRI_LANCERING_TOT_DEFAULT}T00:00:00+01:00`) : d;
}
export function kolibriLanceringActief(op: Date = new Date()): boolean {
  return op.getTime() < kolibriLanceringTot().getTime();
}
export function kolibriLanceringsTarief(): number {
  const v = Number(process.env.MAKELAAR_KOLIBRI_LANCERING_PRIJS);
  return isFinite(v) && v > 0 ? v : 55;
}
// Tarief dat nu geldt voor een nieuwe Kolibri-plaatsing (voor weergave).
export function kolibriTariefNu(op: Date = new Date()): number {
  return kolibriLanceringActief(op) ? kolibriLanceringsTarief() : makelaarBasisTarief();
}
// Prijs voor een enkel object: Kolibri-objecten krijgen t/m de einddatum het
// lanceringstarief; overige bronnen (bijv. Realworks) het basistarief.
export function objectPrijs(listing: { source?: string }, op: Date = new Date()): number {
  if (listing && listing.source === "kolibri" && kolibriLanceringActief(op)) {
    return kolibriLanceringsTarief();
  }
  return makelaarBasisTarief();
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

  const regels = objecten.map((o) => ({ titel: o.titel, prijs: objectPrijs(o) }));
  const bedrag = Math.round(regels.reduce((s, r) => s + r.prijs, 0) * 100) / 100;
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
    objecten: regels,
    prijsPerObject: regels[0]?.prijs ?? makelaarBasisTarief(),
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
  listing: { id: string; titel: string; pakket?: any; source?: string }
): Promise<{ ok: boolean; betaalUrl?: string; bedrag?: number; paymentId?: string; factuurnummer?: string }> {
  const owner = getUser(ownerId);
  if (!owner) return { ok: false };
  const bedrag = objectPrijs(listing);
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
  return { ok: true, betaalUrl, bedrag, paymentId: payment.id, factuurnummer: payment.factuurnummer };
}
