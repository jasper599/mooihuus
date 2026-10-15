import { getPayments, getListing, getUser, addPayment, updatePayment, updateListing } from "./db";
import { mollieEnabled, cancelMolliePayment } from "./mollie";
import { sendEmail, renderCreditnota } from "./email";
import { genereerFactuurPdfBase64 } from "./factuur-pdf";
import { COMPANY } from "./company";

const FACTUUR_VAN = process.env.MAIL_FROM_FACTUUR || "Mooihuus <facturen@mooihuus.nl>";
const FACTUUR_KOPIE = process.env.FACTUUR_EMAIL || "facturen@mooihuus.nl";
const FACTUUR_REPLYTO = process.env.FACTUUR_REPLYTO || "facturen@mooihuus.nl";

// Facturen (advertentie-betalingen) die na X dagen niet betaald zijn:
// 1) betaallink annuleren, 2) creditnota maken + mailen (met PDF),
// 3) originele factuur afboeken en de woning on hold zetten.
// De woning wordt pas opnieuw gefactureerd als de makelaar 'm opnieuw in
// Kolibri publiceert (uit de feed halen + weer aanzetten) — dat wordt elders
// afgevangen (releaseVervallenFeedListings bij de sync).
export async function verwerkVervallenAdvertenties(): Promise<{ verwerkt: number }> {
  if (process.env.FACTURATIE_AUTO !== "1") return { verwerkt: 0 };
  const dagen = Number(process.env.VERVAL_DAGEN) || 7;
  const grens = dagen * 24 * 60 * 60 * 1000;
  const nu = Date.now();
  let verwerkt = 0;

  const open = getPayments().filter((p) => p.soort === "advertentie" && p.status === "open");
  for (const p of open) {
    const leeftijd = nu - (Date.parse(p.aangemaakt) || nu);
    if (leeftijd <= grens) continue;

    // 1) betaallink annuleren (best-effort; iDEAL-links vervallen anders vanzelf)
    if (p.mollieId && mollieEnabled()) {
      try { await cancelMolliePayment(p.mollieId); } catch { /* niet fataal */ }
    }

    const listing = getListing(p.listingId);
    const owner = getUser(p.userId);
    const titel = listing?.titel || p.omschrijving || "Advertentie op Mooihuus";
    const totaalIncl = Math.round(Math.abs(p.bedrag) * 100) / 100;
    const subtotaal = Math.round((totaalIncl / 1.21) * 100) / 100;
    const btw = Math.round((totaalIncl - subtotaal) * 100) / 100;

    // 2) creditnota-record (eigen nummer, negatief bedrag)
    const credit = addPayment({
      listingId: p.listingId,
      userId: p.userId,
      pakket: p.pakket,
      bedrag: -totaalIncl,
      status: "paid",
      methode: "creditnota",
      soort: "creditnota",
      omschrijving: "Creditnota bij factuur " + p.factuurnummer + " — niet betaald binnen " + dagen + " dagen",
    });

    // 3) creditnota mailen met PDF (naar makelaar + facturen@)
    if (owner) {
      try {
        const pdf = await genereerFactuurPdfBase64({
          kantoor: owner.bedrijfsnaam || owner.naam,
          factuurnummer: credit.factuurnummer,
          origineelFactuurnummer: p.factuurnummer,
          credit: true,
          objecten: [{ titel, prijs: -subtotaal }],
          prijsPerObject: -subtotaal,
          subtotaal: -subtotaal,
          btw: -btw,
          totaal: -totaalIncl,
          betaalUrl: "",
        });
        const mail = renderCreditnota(owner.bedrijfsnaam || owner.naam, {
          origineel: p.factuurnummer,
          creditnummer: credit.factuurnummer,
          titel,
          bedrag: totaalIncl,
        });
        const bijlage = [{ filename: "Creditnota " + credit.factuurnummer + " Mooihuus.pdf", content: pdf, contentType: "application/pdf" }];
        await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html, van: FACTUUR_VAN, replyTo: FACTUUR_REPLYTO, attachments: bijlage });
        await sendEmail({ aan: [FACTUUR_KOPIE, COMPANY.email], onderwerp: "Kopie — " + mail.onderwerp, soort: "factuur", html: mail.html, van: FACTUUR_VAN, replyTo: FACTUUR_REPLYTO, attachments: bijlage });
      } catch { /* mail niet fataal */ }
    }

    // 4) originele factuur afboeken; woning on hold
    updatePayment(p.id, { status: "failed" });
    if (listing) updateListing(listing.id, { vervallen: true, vervallenOp: new Date().toISOString() });
    verwerkt++;
  }
  return { verwerkt };
}
