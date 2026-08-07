import { getPayment, updatePayment, getListing, updateListing, getUser, zoekopdrachtenVoorWoning } from "./db";
import { renderBetalingsbewijs, renderOpvallerBewijs, renderWoningAlert, renderFactuurBetaald, sendEmail } from "./email";
import { COMPANY } from "./company";

// Markeer een betaling als betaald. Idempotent — dubbel aanroepen (bijv.
// webhook + redirect) doet niets extra's.
// - Advertentie: activeert de advertentie en stuurt het betalingsbewijs.
// - Opvaller: past de boost toe op de bestaande (live) advertentie.
export async function markPaymentPaid(paymentId: string, methode: string): Promise<boolean> {
  const payment = getPayment(paymentId);
  if (!payment) return false;
  if (payment.status === "paid") return true;

  const nu = new Date().toISOString();
  updatePayment(payment.id, { status: "paid", methode, betaaldOp: nu });

  // Makelaar-/losse factuur: ná betaling de échte factuur + betaalbewijs sturen
  // naar de betaler, met een kopie naar Mooihuus.
  if (payment.soort === "makelaar-factuur") {
    const kantoor = getUser(payment.userId);
    if (kantoor) {
      const updated = getPayment(payment.id)!;
      const mail = renderFactuurBetaald(updated, kantoor.bedrijfsnaam || kantoor.naam);
      await sendEmail({ aan: kantoor.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html });
      await sendEmail({ aan: COMPANY.email, onderwerp: `Kopie: ${mail.onderwerp}`, soort: "factuur", html: mail.html });
    }
    return true;
  }

  const listing = getListing(payment.listingId);
  const owner = getUser(payment.userId);

  if (payment.soort === "opvaller") {
    // Boost toepassen op de bestaande advertentie.
    if (listing) {
      const id = payment.omschrijving; // opvaller-id, bijv. "Blikvanger"
      if (id === "Blikvanger") {
        updateListing(listing.id, { uitgelicht: true, promotedAt: nu });
      } else if (id === "Omhoog" || id === "Dagtopper") {
        updateListing(listing.id, { promotedAt: nu });
      }
      // "Social spotlight": geen wijziging aan de advertentie, wordt handmatig gepost.
    }
    if (owner && listing) {
      const updated = getPayment(payment.id)!;
      const mail = renderOpvallerBewijs(updated, listing, owner.naam);
      await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "betalingsbewijs", html: mail.html });
      await sendEmail({ aan: COMPANY.email, onderwerp: `Kopie: ${mail.onderwerp}`, soort: "betalingsbewijs", html: mail.html });
    }
    return true;
  }

  // Advertentie: zet live.
  if (listing) updateListing(listing.id, { status: "live" });

  // Woning-alerts: mail zoekers met een passende zoekopdracht.
  if (listing) {
    const live = getListing(listing.id)!;
    for (const z of zoekopdrachtenVoorWoning(live)) {
      const mail = renderWoningAlert(z, live);
      await sendEmail({ aan: z.email, onderwerp: mail.onderwerp, soort: "alert", html: mail.html });
    }
  }

  if (owner && listing) {
    const updated = getPayment(payment.id)!;
    const mail = renderBetalingsbewijs(updated, listing, owner.naam);
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "betalingsbewijs", html: mail.html });
    await sendEmail({ aan: COMPANY.email, onderwerp: `Kopie: ${mail.onderwerp}`, soort: "betalingsbewijs", html: mail.html });
  }
  return true;
}
