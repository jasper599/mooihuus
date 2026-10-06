import { getPayment, updatePayment, getListing, updateListing, getUser, zoekopdrachtenVoorWoning, addSocialPost, updateSocialPost } from "./db";
import { renderBetalingsbewijs, renderOpvallerBewijs, renderWoningAlert, renderFactuurBetaald, renderVerlengBevestiging, sendEmail } from "./email";
import { COMPANY } from "./company";
import { metricoolEnabled, scheduleInstagramPost, volgendeSlot } from "./metricool";
import { genereerSocialCaption } from "./social-caption";
import { activeerVerlenging } from "./verlenging";

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

  // Verlenging: de woningen weer een jaar online zetten en bevestigen.
  if (payment.soort === "verlenging") {
    const ids = payment.listingIds || (payment.listingId ? [payment.listingId] : []);
    activeerVerlenging(ids, new Date(nu));
    const klant = getUser(payment.userId);
    if (klant) {
      const updated = getPayment(payment.id)!;
      const mail = renderVerlengBevestiging(updated, klant.bedrijfsnaam || klant.naam, ids.length);
      await sendEmail({ aan: klant.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html });
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
      } else if (id === "Social spotlight") {
        // Betaalde social-post → met VOORRANG in de Instagram-wachtrij.
        const publishAt = volgendeSlot(true, new Date());
        const caption = await genereerSocialCaption(listing);
        const post = addSocialPost({
          listingId: listing.id,
          kanaal: "instagram",
          prioriteit: true,
          status: "wachtrij",
          bron: "bestelling",
          paymentId: payment.id,
          tekst: caption,
          fotoUrl: listing.fotos?.[0],
        });
        // Direct inplannen als Metricool gekoppeld is; anders blijft 'ie in de
        // wachtrij (met voorrang) voor handmatige plaatsing vanuit de backoffice.
        if (metricoolEnabled()) {
          const r = await scheduleInstagramPost({ tekst: post.tekst || listing.titel, fotoUrl: post.fotoUrl, publishAt });
          if (r.ok) updateSocialPost(post.id, { status: "ingepland", metricoolId: r.id, ingeplandVoor: publishAt });
          else updateSocialPost(post.id, { notitie: `Metricool: ${r.error || "inplannen mislukt"}` });
        }
      }
    }
    if (owner && listing) {
      const updated = getPayment(payment.id)!;
      const mail = renderOpvallerBewijs(updated, listing, owner.naam);
      await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "betalingsbewijs", html: mail.html });
      await sendEmail({ aan: COMPANY.email, onderwerp: `Kopie: ${mail.onderwerp}`, soort: "betalingsbewijs", html: mail.html });
    }
    return true;
  }

  // Advertentie: zet live en start het advertentiejaar (voor de verlenging).
  if (listing) updateListing(listing.id, { status: "live", periodeStart: nu });

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
