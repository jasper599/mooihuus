import { getUser, getListingsByOwner, addPayment, updatePayment } from "./db";
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
    (l) => l.status === "live" && (l.source === "kolibri" || l.source === "realworks")
  );
}

function baseUrl(): string {
  return process.env.NEXTAUTH_URL || COMPANY.website;
}

// Maakt een factuur voor één makelaar/kantoor: telt de objecten, maakt een
// Mollie-betaallink en mailt de factuur met die link naar de makelaar.
export async function maakMakelaarFactuur(ownerId: string): Promise<{
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
    omschrijving: `Advertenties Mooihuus — ${objecten.length} objecten`,
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
  await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html });

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
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html });
  }

  return { ok: true, bedrag, betaalUrl, factuurnummer: payment.factuurnummer, paymentId: payment.id };
}
