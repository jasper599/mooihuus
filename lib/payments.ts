import { getPayment, updatePayment, getListing, updateListing, getUser } from "./db";
import { renderBetalingsbewijs, renderOpvallerBewijs, sendEmail } from "./email";

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
    }
    return true;
  }

  // Advertentie: zet live.
  if (listing) updateListing(listing.id, { status: "live" });
  if (owner && listing) {
    const updated = getPayment(payment.id)!;
    const mail = renderBetalingsbewijs(updated, listing, owner.naam);
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "betalingsbewijs", html: mail.html });
  }
  return true;
}
