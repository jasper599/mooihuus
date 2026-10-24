import { getPayment, getPayments, updatePayment, getListing, updateListing, getUser, zoekopdrachtenVoorWoning, addSocialPost, updateSocialPost } from "./db";
import { mollieEnabled, getMollieStatus } from "./mollie";
import { renderBetalingsbewijs, renderOpvallerBewijs, renderWoningAlert, renderFactuurBetaald, renderVerlengBevestiging, renderSocialTopperAlert, sendEmail } from "./email";
import { COMPANY } from "./company";
import { metricoolEnabled, scheduleInstagramPost, volgendeSlot } from "./metricool";
import { genereerSocialCaption } from "./social-caption";
import { activeerVerlenging } from "./verlenging";
import { instagramEnabled, postToInstagram } from "./instagram";
import { guusBeltJasperOpAchtergrond } from "./guus-bel";
import { genereerFactuurPdfBase64 } from "./factuur-pdf";

const FACTUUR_VAN = process.env.MAIL_FROM_FACTUUR || "Mooihuus <facturen@mooihuus.nl>";
const FACTUUR_KOPIE = process.env.FACTUUR_EMAIL || "facturen@mooihuus.nl";
const FACTUUR_REPLYTO = process.env.FACTUUR_REPLYTO || "facturen@mooihuus.nl";

function euroKort(n: number): string {
  return "€" + (Math.round((n || 0) * 100) / 100).toLocaleString("nl-NL");
}

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
      await sendEmail({ aan: kantoor.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html, van: FACTUUR_VAN, replyTo: FACTUUR_REPLYTO });
      await sendEmail({ aan: [FACTUUR_KOPIE, COMPANY.email], onderwerp: `Kopie: ${mail.onderwerp}`, soort: "factuur", html: mail.html, van: FACTUUR_VAN, replyTo: FACTUUR_REPLYTO });
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
        // Uitgelicht voor 1 week; de scheduler zet 'm daarna automatisch weer uit.
        const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        updateListing(listing.id, { uitgelicht: true, uitgelichtTot: week, promotedAt: nu });
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
        if (instagramEnabled()) {
          const r = await postToInstagram({ imageUrl: post.fotoUrl, caption: post.tekst || caption });
          if (r.ok) updateSocialPost(post.id, { status: "geplaatst", geplaatstOp: new Date().toISOString(), metricoolId: r.id, notitie: undefined });
          else updateSocialPost(post.id, { notitie: `Instagram: ${r.error || "plaatsen mislukt"}` });
        } else if (metricoolEnabled()) {
          const r = await scheduleInstagramPost({ tekst: post.tekst || listing.titel, fotoUrl: post.fotoUrl, publishAt });
          if (r.ok) updateSocialPost(post.id, { status: "ingepland", metricoolId: r.id, ingeplandVoor: publishAt });
          else updateSocialPost(post.id, { notitie: `Metricool: ${r.error || "inplannen mislukt"}` });
        } else {
          // Geen Metricool-koppeling: stuur een alert naar Mooihuus met alles klaar
          // voor handmatige plaatsing (voorkomt de Metricool-abonnementskosten).
          try {
            const mailA = renderSocialTopperAlert(listing.titel, post.tekst || caption, post.fotoUrl);
            await sendEmail({ aan: COMPANY.email, onderwerp: mailA.onderwerp, soort: "alert", html: mailA.html });
          } catch {
            /* alert mislukt — post staat nog in de wachtrij */
          }
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
    let bijlage: { filename: string; content: string; contentType?: string }[] | undefined;
    try {
      const totaalIncl = Math.round(Math.abs(updated.bedrag) * 100) / 100;
      const sub = Math.round((totaalIncl / 1.21) * 100) / 100;
      const btw = Math.round((totaalIncl - sub) * 100) / 100;
      const pdf = await genereerFactuurPdfBase64({
        kantoor: owner.bedrijfsnaam || owner.naam,
        email: owner.email,
        factuurnummer: updated.factuurnummer,
        objecten: [{ titel: listing.titel, prijs: sub }],
        prijsPerObject: sub,
        subtotaal: sub,
        btw,
        totaal: totaalIncl,
        betaalUrl: "",
        betaald: true,
        betaaldOp: updated.betaaldOp || nu,
      });
      bijlage = [{ filename: "Factuur " + updated.factuurnummer + " (betaald) Mooihuus.pdf", content: pdf, contentType: "application/pdf" }];
    } catch {
      bijlage = undefined;
    }
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "betalingsbewijs", html: mail.html, van: FACTUUR_VAN, replyTo: FACTUUR_REPLYTO, attachments: bijlage });
    await sendEmail({ aan: [FACTUUR_KOPIE, COMPANY.email], onderwerp: `Kopie: ${mail.onderwerp}`, soort: "betalingsbewijs", html: mail.html, van: FACTUUR_VAN, replyTo: FACTUUR_REPLYTO, attachments: bijlage });
  }

  // Nieuwe betaalde plaatsing: Guus belt Jasper even met het goede nieuws.
  if (listing) {
    const wie = owner?.bedrijfsnaam || owner?.naam || "een particulier";
    guusBeltJasperOpAchtergrond(
      `Hoi Jasper, met Guus. Goed nieuws: er is net een nieuwe betaalde plaatsing. ${wie} heeft ${listing.titel} online gezet, pakket ${payment.pakket}, voor ${euroKort(payment.bedrag)}.`
    );
  }
  return true;
}

// Vangnet voor gemiste Mollie-webhooks: controleer openstaande betalingen met
// een Mollie-id bij Mollie en zet ze alsnog door als de betaling 'paid' is.
// Zo gaat een betaalde woning altijd live, ook als de webhook ooit niet aankwam.
export async function verwerkOpenstaandeBetalingen(): Promise<{ gecontroleerd: number; betaald: number }> {
  if (!mollieEnabled()) return { gecontroleerd: 0, betaald: 0 };
  const open = getPayments().filter((p) => p.status === "open" && !!p.mollieId);
  let betaald = 0;
  for (const p of open) {
    try {
      const status = await getMollieStatus(p.mollieId as string);
      if (status === "paid") {
        await markPaymentPaid(p.id, "iDEAL");
        betaald++;
      }
    } catch {
      /* volgende run opnieuw */
    }
  }
  return { gecontroleerd: open.length, betaald };
}

// Eenmalige/idempotente correctie: zet bestaande advertentie-, factuur- en
// verlengbetalingen van feed-makelaars op pakket "Premium" (voorheen stond er
// per abuis "Basis"). Draait mee met de sync en doet na de eerste keer niets meer.
export function corrigeerMakelaarPakket(): number {
  let n = 0;
  for (const p of getPayments()) {
    if ((p.pakket as any) === "Premium") continue;
    if (p.soort !== "advertentie" && p.soort !== "makelaar-factuur" && p.soort !== "verlenging") continue;
    const listing = getListing(p.listingId);
    const feed = !!listing && (listing.source === "kolibri" || listing.source === "realworks");
    const u = getUser(p.userId);
    const makelaar = !!u && u.type === "zakelijk" && !!u.realtorId;
    if (feed || makelaar) { updatePayment(p.id, { pakket: "Premium" as any }); n++; }
  }
  return n;
}
