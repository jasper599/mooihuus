import { getPayment, updatePayment, getListing, updateListing, getUser, zoekopdrachtenVoorWoning } from "./db";
import { renderBetalingsbewijs, renderOpvallerBewijs, renderWoningAlert, sendEmail } from "./email";

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

  // Makelaar-factuur: alleen betaald markeren + korte bevestiging, geen woninglogica.
  if (payment.soort === "makelaar-factuur") {
    const kantoor = getUser(payment.userId);
    if (kantoor) {
      const inner = `<h1 style="font-size:22px;color:#1F4E32;margin:0 0 10px;">Betaling ontvangen — bedankt!</h1>
        <p style="line-height:1.6;">We hebben je betaling van factuur <strong>${payment.factuurnummer}</strong> ontvangen. Je recreatiewoningen blijven live op Mooihuus.</p>`;
      const { renderSimpel } = await import("./email");
      const mail = renderSimpel("Betaling ontvangen — Mooihuus", inner);
      await sendEmail({ aan: kantoor.email, onderwerp: mail.onderwerp, soort: "betalingsbewijs", html: mail.html });
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
  }
  return true;
}
