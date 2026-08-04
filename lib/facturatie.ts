import { getUser, getListingsByOwner, addPayment, updatePayment } from "./db";
import { mollieEnabled, createMolliePayment } from "./mollie";
import { renderMakelaarFactuur, sendEmail } from "./email";
import { COMPANY } from "./company";

// Prijs per gepubliceerd object (per factuurronde). Instelbaar via env.
export function prijsPerObject(): number {
  const v = Number(process.env.MAKELAAR_OBJECT_PRIJS);
  return isFinite(v) && v > 0 ? v : 4.95;
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

  const prijs = prijsPerObject();
  const bedrag = Math.round(objecten.length * prijs * 100) / 100;
  const kantoor = owner.bedrijfsnaam || owner.naam;

  // Registreer de factuur als betaling (open).
  const payment = addPayment({
    listingId: `makelaar-${ownerId}`,
    userId: ownerId,
    pakket: "Basis",
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
