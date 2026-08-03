import fs from "fs";
import path from "path";
import { addEmail } from "./db";
import { EmailRecord, Listing, Payment, Lead } from "./types";
import { euroCents } from "./money";

// ------------------------------------------------------------------
// E-mail: rendert merk-HTML en "verstuurt".
// - Met SMTP_HOST ingesteld: echt versturen via nodemailer.
// - Zonder: preview-modus — de mail wordt opgeslagen (zichtbaar in het
//   backoffice) en als .html naar ./data/outbox geschreven.
// ------------------------------------------------------------------

const BRAND = {
  bosgroen: "#2C6B45",
  bosgroenDk: "#1F4E32",
  salie: "#7CAE86",
  oranje: "#E8823B",
  oranjeDk: "#C9691F",
  zand: "#F6F1E7",
  creme: "#FBF8F1",
  inkt: "#22302A",
  grijs: "#6B7A70",
  lijn: "#E4DCCB",
};

function layout(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;background:${BRAND.zand};font-family:Arial,Helvetica,sans-serif;color:${BRAND.inkt};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.zand};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:${BRAND.bosgroen};padding:22px 28px;border-radius:16px 16px 0 0;">
    <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.01em;">
      <span style="color:${BRAND.salie};">Mooi</span><span style="color:#fff;">huus</span><span style="color:${BRAND.oranje};">.nl</span>
    </span>
  </td></tr>
  <tr><td style="background:#fff;padding:30px 28px;border-left:1px solid ${BRAND.lijn};border-right:1px solid ${BRAND.lijn};">
    ${inner}
  </td></tr>
  <tr><td style="background:${BRAND.creme};padding:18px 28px;border:1px solid ${BRAND.lijn};border-top:none;border-radius:0 0 16px 16px;font-size:12px;color:${BRAND.grijs};">
    Mooihuus.nl — een idee van Luyten Makelaardij, om iedereen te helpen.<br>
    Vragen? Mail <a href="mailto:info@mooihuus.nl" style="color:${BRAND.bosgroen};">info@mooihuus.nl</a>. Zelf de regie, nooit alleen.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${BRAND.oranje};color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:10px;">${label}</a>`;

export function renderWelkom(naam: string): { onderwerp: string; html: string } {
  const inner = `
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:0 0 10px;">Welkom bij Mooihuus, ${naam}! 👋</h1>
    <p style="line-height:1.6;">Je account is aangemaakt. Vanaf nu zet je je recreatiewoning zelf in de etalage — met de regie in eigen hand en hulp binnen handbereik.</p>
    <p style="line-height:1.6;">Klaar om te beginnen? Plaats je eerste woning in een paar minuten.</p>
    <p style="margin:22px 0;">${btn("http://localhost:3000/plaatsen", "Plaats je huus")}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:14px;">Fijn dat je er bent.<br>Team Mooihuus</p>`;
  return { onderwerp: "Welkom bij Mooihuus 🌲", html: layout("Welkom", inner) };
}

export function renderBetalingsbewijs(p: Payment, listing: Listing, naam: string): { onderwerp: string; html: string } {
  const inner = `
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:0 0 6px;">Bedankt, ${naam} — je betaling is gelukt ✅</h1>
    <p style="line-height:1.6;">Je advertentie <strong>“${listing.titel}”</strong> staat nu online. Hieronder je betalingsbewijs.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.lijn};border-radius:12px;overflow:hidden;margin:18px 0;">
      <tr><td style="background:${BRAND.creme};padding:12px 16px;font-size:13px;color:${BRAND.grijs};">Factuurnummer</td>
          <td style="background:${BRAND.creme};padding:12px 16px;font-size:13px;text-align:right;font-weight:bold;color:${BRAND.inkt};">${p.factuurnummer}</td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};">Pakket ${p.pakket}</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;">${euroCents(p.kortingPct ? p.bedrag / (1 - p.kortingPct / 100) : p.bedrag)}</td></tr>
      ${p.kortingPct ? `<tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};color:${BRAND.oranjeDk};">Volumekorting −${p.kortingPct}%</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;color:${BRAND.oranjeDk};">−${euroCents(p.bedrag / (1 - p.kortingPct / 100) - p.bedrag)}</td></tr>` : ""}
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};color:${BRAND.grijs};font-size:13px;">waarvan 21% btw</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;color:${BRAND.grijs};font-size:13px;">${euroCents(p.bedrag - p.bedrag / 1.21)}</td></tr>
      <tr><td style="padding:12px 16px;border-top:2px solid ${BRAND.bosgroen};font-weight:bold;">Totaal betaald</td>
          <td style="padding:12px 16px;border-top:2px solid ${BRAND.bosgroen};text-align:right;font-weight:bold;color:${BRAND.bosgroenDk};">${euroCents(p.bedrag)}</td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};color:${BRAND.grijs};font-size:13px;">Betaalmethode</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;color:${BRAND.grijs};font-size:13px;">${p.methode}</td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};color:${BRAND.grijs};font-size:13px;">Betaald op</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;color:${BRAND.grijs};font-size:13px;">${p.betaaldOp ? new Date(p.betaaldOp).toLocaleString("nl-NL") : "-"}</td></tr>
    </table>
    <p style="margin:22px 0;">${btn("http://localhost:3000/dashboard", "Naar mijn dashboard")}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;">Bewaar deze mail als bewijs van betaling. Klopt er iets niet? Mail info@mooihuus.nl.</p>`;
  return { onderwerp: `Betalingsbewijs ${p.factuurnummer} — je huus staat online`, html: layout("Betalingsbewijs", inner) };
}

export function renderOpvallerBewijs(p: Payment, listing: Listing, naam: string): { onderwerp: string; html: string } {
  const opv = p.omschrijving || "Opvaller";
  const inner = `
    <span style="display:inline-block;background:${BRAND.oranje};color:#fff;font-size:12px;font-weight:bold;padding:3px 10px;border-radius:999px;">Opvaller geactiveerd 🚀</span>
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:12px 0 6px;">Bedankt, ${naam} — je opvaller staat aan</h1>
    <p style="line-height:1.6;">De opvaller <strong>“${opv}”</strong> is geactiveerd voor je advertentie <strong>“${listing.titel}”</strong>. Hieronder je betalingsbewijs.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.lijn};border-radius:12px;overflow:hidden;margin:18px 0;">
      <tr><td style="background:${BRAND.creme};padding:12px 16px;font-size:13px;color:${BRAND.grijs};">Factuurnummer</td>
          <td style="background:${BRAND.creme};padding:12px 16px;font-size:13px;text-align:right;font-weight:bold;color:${BRAND.inkt};">${p.factuurnummer}</td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};">Opvaller ${opv}</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;">${euroCents(p.bedrag)}</td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};color:${BRAND.grijs};font-size:13px;">waarvan 21% btw</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;color:${BRAND.grijs};font-size:13px;">${euroCents(p.bedrag - p.bedrag / 1.21)}</td></tr>
      <tr><td style="padding:12px 16px;border-top:2px solid ${BRAND.bosgroen};font-weight:bold;">Totaal betaald</td>
          <td style="padding:12px 16px;border-top:2px solid ${BRAND.bosgroen};text-align:right;font-weight:bold;color:${BRAND.bosgroenDk};">${euroCents(p.bedrag)}</td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};color:${BRAND.grijs};font-size:13px;">Betaald op</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;color:${BRAND.grijs};font-size:13px;">${p.betaaldOp ? new Date(p.betaaldOp).toLocaleString("nl-NL") : "-"}</td></tr>
    </table>
    <p style="margin:22px 0;">${btn("http://localhost:3000/dashboard", "Naar mijn dashboard")}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;">Bewaar deze mail als bewijs van betaling. Klopt er iets niet? Mail info@mooihuus.nl.</p>`;
  return { onderwerp: `Betalingsbewijs ${p.factuurnummer} — opvaller ${opv}`, html: layout("Betalingsbewijs opvaller", inner) };
}

export function renderLead(lead: Lead, listing: Listing, ownerNaam: string): { onderwerp: string; html: string } {
  const inner = `
    <span style="display:inline-block;background:${BRAND.oranje};color:#fff;font-size:12px;font-weight:bold;padding:3px 10px;border-radius:999px;">Nieuwe lead — rechtstreeks naar jou</span>
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:12px 0 6px;">Iemand heeft interesse in “${listing.titel}” 🎉</h1>
    <p style="line-height:1.6;">Hoi ${ownerNaam}, je hebt een nieuw bericht via Mooihuus. Reageer snel — een vlotte reactie maakt het verschil.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.lijn};border-radius:12px;overflow:hidden;margin:18px 0;">
      <tr><td style="background:${BRAND.creme};padding:12px 16px;font-size:13px;color:${BRAND.grijs};width:120px;">Van</td>
          <td style="background:${BRAND.creme};padding:12px 16px;font-weight:bold;">${lead.naam}</td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};font-size:13px;color:${BRAND.grijs};">E-mail</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};"><a href="mailto:${lead.email}" style="color:${BRAND.bosgroen};">${lead.email}</a></td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};font-size:13px;color:${BRAND.grijs};vertical-align:top;">Bericht</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};line-height:1.6;">“${lead.bericht}”</td></tr>
    </table>
    <p style="margin:22px 0;">${btn("mailto:" + lead.email, "Beantwoord " + lead.naam.split(" ")[0])}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;">Deze aanvraag kwam rechtstreeks bij jou binnen. Mooihuus zit er niet tussen.</p>`;
  return { onderwerp: `Nieuwe interesse in “${listing.titel}”`, html: layout("Nieuwe lead", inner) };
}

export function renderContact(d: {
  naam: string;
  email: string;
  onderwerp: string;
  bericht: string;
  categorie?: string;
  regio?: string;
}): { onderwerp: string; html: string } {
  const rows = [
    ["Van", d.naam],
    ["E-mail", d.email],
    ...(d.categorie ? [["Categorie", d.categorie]] : []),
    ...(d.regio ? [["Regio", d.regio]] : []),
    ["Onderwerp", d.onderwerp],
  ];
  const inner = `
    <span style="display:inline-block;background:${BRAND.bosgroen};color:#fff;font-size:12px;font-weight:bold;padding:3px 10px;border-radius:999px;">Nieuw bericht via de site</span>
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:12px 0 6px;">${d.onderwerp}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.lijn};border-radius:12px;overflow:hidden;margin:18px 0;">
      ${rows.map(([k, v], i) => `<tr><td style="padding:12px 16px;${i ? `border-top:1px solid ${BRAND.lijn};` : `background:${BRAND.creme};`}font-size:13px;color:${BRAND.grijs};width:120px;">${k}</td>
          <td style="padding:12px 16px;${i ? `border-top:1px solid ${BRAND.lijn};` : `background:${BRAND.creme};`}">${k === "E-mail" ? `<a href="mailto:${v}" style="color:${BRAND.bosgroen};">${v}</a>` : v}</td></tr>`).join("")}
      <tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};font-size:13px;color:${BRAND.grijs};vertical-align:top;">Bericht</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};line-height:1.6;">${d.bericht.replace(/</g, "&lt;")}</td></tr>
    </table>
    <p style="margin:22px 0;">${btn("mailto:" + d.email, "Beantwoord " + d.naam.split(" ")[0])}</p>`;
  return { onderwerp: `[Mooihuus] ${d.onderwerp} — ${d.naam}`, html: layout("Nieuw bericht", inner) };
}

export async function sendEmail(opts: {
  aan: string;
  onderwerp: string;
  soort: EmailRecord["soort"];
  html: string;
}): Promise<EmailRecord> {
  const smtpHost = process.env.SMTP_HOST;
  let via: EmailRecord["verzondenVia"] = "preview";

  if (smtpHost) {
    try {
      // Echte verzending. Vereist SMTP_* env-variabelen.
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await transport.sendMail({
        from: process.env.MAIL_FROM || "Mooihuus <info@mooihuus.nl>",
        to: opts.aan,
        subject: opts.onderwerp,
        html: opts.html,
      });
      via = "smtp";
    } catch (e) {
      via = "preview";
    }
  }

  // Preview: schrijf naar ./data/outbox voor makkelijk inzien.
  try {
    const dir = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "outbox");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const safe = opts.onderwerp.replace(/[^a-z0-9]+/gi, "-").slice(0, 50);
    fs.writeFileSync(path.join(dir, `${Date.now()}-${safe}.html`), opts.html, "utf8");
  } catch {
    /* niet fataal */
  }

  return addEmail({ aan: opts.aan, onderwerp: opts.onderwerp, soort: opts.soort, html: opts.html, verzondenVia: via });
}
