import fs from "fs";
import path from "path";
import { addEmail } from "./db";
import { EmailRecord, Listing, Payment, Lead, Zoekopdracht } from "./types";
import { euroCents, euro } from "./money";
import { COMPANY } from "./company";

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
    <p style="margin:22px 0;">${btn(`${COMPANY.website}/plaatsen`, "Plaats je huus")}</p>
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
    <p style="margin:22px 0;">${btn(`${COMPANY.website}/dashboard`, "Naar mijn dashboard")}</p>
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
    <p style="margin:22px 0;">${btn(`${COMPANY.website}/dashboard`, "Naar mijn dashboard")}</p>
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

function woningRegel(l: Listing): string {
  const url = `${COMPANY.website}/aanbod/${l.id}`;
  return `<tr><td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};">
      <a href="${url}" style="color:${BRAND.bosgroenDk};font-weight:bold;text-decoration:none;">${l.titel}</a><br>
      <span style="color:${BRAND.grijs};font-size:13px;">${l.type} · ${l.personen} pers · ${l.provincie} · ${l.doel === "huur" ? "te huur" : "te koop"}</span>
    </td>
    <td style="padding:12px 16px;border-top:1px solid ${BRAND.lijn};text-align:right;color:${BRAND.oranjeDk};font-weight:bold;white-space:nowrap;">${euro(l.prijs)}</td></tr>`;
}

export function renderWoningAlert(z: Zoekopdracht, listing: Listing): { onderwerp: string; html: string } {
  const inner = `
    <span style="display:inline-block;background:${BRAND.oranje};color:#fff;font-size:12px;font-weight:bold;padding:3px 10px;border-radius:999px;">Nieuwe match 🎯</span>
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:12px 0 6px;">Er staat een nieuwe woning die bij je zoekopdracht past</h1>
    <p style="line-height:1.6;">Hoi ${z.naam || "daar"}, we vonden een nieuwe woning op Mooihuus die aansluit bij wat je zoekt:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.lijn};border-radius:12px;overflow:hidden;margin:18px 0;">
      ${woningRegel(listing)}
    </table>
    <p style="margin:22px 0;">${btn(`${COMPANY.website}/aanbod/${listing.id}`, "Bekijk de woning")}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;">Je ontvangt deze mail omdat je een woning-alert hebt ingesteld op Mooihuus. Reageren op de woning gaat rechtstreeks naar de aanbieder.</p>`;
  return { onderwerp: `Nieuwe match: ${listing.titel}`, html: layout("Nieuwe match", inner) };
}

export function renderZoekBevestiging(z: Zoekopdracht, matches: Listing[]): { onderwerp: string; html: string } {
  const wensen = [
    z.doel && z.doel !== "alle" ? (z.doel === "huur" ? "te huur" : "te koop") : null,
    z.provincie && z.provincie !== "alle" ? z.provincie : null,
    z.prijsMax ? `tot ${euro(z.prijsMax)}` : null,
    z.personenMin ? `vanaf ${z.personenMin} personen` : null,
    z.type || null,
  ].filter(Boolean).join(" · ") || "alle recreatiewoningen";
  const lijst = matches.slice(0, 5).map(woningRegel).join("");
  const inner = `
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:0 0 6px;">Je woning-alert staat aan ✅</h1>
    <p style="line-height:1.6;">Hoi ${z.naam || "daar"}, je zoekopdracht is opgeslagen. Zodra er een nieuwe woning bij past, krijg je meteen een mailtje.</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:14px;">Je zoekt: <strong>${wensen}</strong>.</p>
    ${matches.length ? `<p style="line-height:1.6;">Dit past nú al bij je zoekopdracht:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.lijn};border-radius:12px;overflow:hidden;margin:14px 0;">${lijst}</table>` : `<p style="line-height:1.6;">Er staat nu nog niets dat precies past — maar zodra dat verandert, ben jij de eerste die het weet.</p>`}
    <p style="margin:22px 0;">${btn(`${COMPANY.website}/`, "Bekijk het aanbod")}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;">Je kunt je op elk moment afmelden door te reageren op deze mail.</p>`;
  return { onderwerp: "Je woning-alert op Mooihuus staat aan", html: layout("Woning-alert", inner) };
}

export function renderWachtwoordReset(naam: string, resetUrl: string): { onderwerp: string; html: string } {
  const inner = `
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:0 0 10px;">Wachtwoord opnieuw instellen</h1>
    <p style="line-height:1.6;">Hoi ${naam || "daar"}, je hebt gevraagd om je wachtwoord opnieuw in te stellen. Klik op de knop hieronder om een nieuw wachtwoord te kiezen. Deze link is 1 uur geldig.</p>
    <p style="margin:22px 0;">${btn(resetUrl, "Nieuw wachtwoord instellen")}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;">Heb je dit niet aangevraagd? Dan kun je deze mail negeren; er verandert niets aan je account.</p>
    <p style="line-height:1.4;color:${BRAND.grijs};font-size:12px;word-break:break-all;">Werkt de knop niet? Kopieer deze link: ${resetUrl}</p>`;
  return { onderwerp: "Stel je Mooihuus-wachtwoord opnieuw in", html: layout("Wachtwoord opnieuw instellen", inner) };
}

function woningRij(l: Listing): string {
  const foto = l.fotos && l.fotos[0];
  const media = foto
    ? `<img src="${foto}" width="540" alt="${l.titel}" style="width:100%;max-width:540px;height:180px;object-fit:cover;border-radius:12px;display:block;border:1px solid ${BRAND.lijn};" />`
    : `<div style="width:100%;height:180px;border-radius:12px;background:${BRAND.salie};"></div>`;
  const suffix = l.prijsSuffix && l.prijsSuffix !== "geen" ? l.prijsSuffix : l.doel === "koop" ? "k.k." : "";
  return `<a href="${COMPANY.website}/aanbod/${l.id}" style="text-decoration:none;color:${BRAND.inkt};display:block;margin:14px 0;">
    ${media}
    <div style="padding:8px 2px 0;">
      <div style="font-weight:bold;color:${BRAND.bosgroenDk};font-size:15px;">${l.titel}</div>
      <div style="color:${BRAND.grijs};font-size:13px;">${l.type} · ${l.provincie}</div>
      <div style="color:${BRAND.oranjeDk};font-weight:bold;font-size:15px;">${euro(l.prijs)}${suffix ? " " + suffix : ""}</div>
    </div>
  </a>`;
}

function woningenBlok(titel: string, list: Listing[]): string {
  if (!list.length) return "";
  return `<div style="margin-top:22px;">
    <div style="font-weight:bold;color:${BRAND.bosgroenDk};font-size:16px;margin-bottom:2px;">${titel}</div>
    ${list.map(woningRij).join("")}
  </div>`;
}

export function renderMaandrapport(d: {
  kantoor: string;
  maand: string;
  rows: { titel: string; weergaven: number; leads: number }[];
  totWeergaven: number;
  totLeads: number;
}): { onderwerp: string; html: string } {
  const rows = d.rows
    .map(
      (r, i) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.lijn};font-size:13px;">${r.titel}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.lijn};font-size:13px;text-align:right;">${r.weergaven}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.lijn};font-size:13px;text-align:right;">${r.leads}</td>
    </tr>`
    )
    .join("");
  const inner = `
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:0 0 4px;">Maandrapport — ${d.maand}</h1>
    <div style="color:${BRAND.grijs};font-size:13px;margin-bottom:14px;">${d.kantoor} · jouw aanbod op Mooihuus</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0;color:${BRAND.grijs};font-size:12px;text-transform:uppercase;letter-spacing:.04em;">Woning</td>
        <td style="padding:6px 0;color:${BRAND.grijs};font-size:12px;text-align:right;text-transform:uppercase;">Weergaven</td>
        <td style="padding:6px 0;color:${BRAND.grijs};font-size:12px;text-align:right;text-transform:uppercase;">Leads</td>
      </tr>
      ${rows}
      <tr>
        <td style="padding:12px 0 0;font-weight:bold;font-size:14px;">Totaal (${d.rows.length} woningen)</td>
        <td style="padding:12px 0 0;font-weight:bold;font-size:14px;text-align:right;color:${BRAND.oranjeDk};">${d.totWeergaven}</td>
        <td style="padding:12px 0 0;font-weight:bold;font-size:14px;text-align:right;color:${BRAND.oranjeDk};">${d.totLeads}</td>
      </tr>
    </table>
    <p style="margin:22px 0;">${btn(`${COMPANY.website}/dashboard`, "Bekijk je dashboard")}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;">Zo houd je grip op wat je aanbod doet. Vragen of meer objecten plaatsen? We helpen je graag.</p>`;
  return { onderwerp: `Maandrapport ${d.maand} — je aanbod op Mooihuus`, html: layout("Maandrapport Mooihuus", inner) };
}

export function renderSimpel(titel: string, innerHtml: string): { onderwerp: string; html: string } {
  return { onderwerp: titel, html: layout(titel, innerHtml) };
}

export function renderMakelaarFactuur(d: {
  kantoor: string;
  factuurnummer: string;
  objecten: { titel: string }[];
  prijsPerObject: number;
  totaal: number;
  betaalUrl: string;
}): { onderwerp: string; html: string } {
  const rows = d.objecten
    .map(
      (o, i) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.lijn};font-size:13px;">${i + 1}. ${o.titel}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.lijn};font-size:13px;text-align:right;">${euroCents(d.prijsPerObject)}</td>
    </tr>`
    )
    .join("");
  const inner = `
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:0 0 4px;">Factuur — advertenties op Mooihuus</h1>
    <div style="color:${BRAND.grijs};font-size:13px;margin-bottom:14px;">Factuurnr. ${d.factuurnummer} · ${d.kantoor}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:${BRAND.grijs};font-size:12px;text-transform:uppercase;letter-spacing:.04em;">Object</td>
          <td style="padding:6px 0;color:${BRAND.grijs};font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:.04em;">Bedrag</td></tr>
      ${rows}
      <tr><td style="padding:12px 0 0;font-weight:bold;font-size:15px;">Totaal (${d.objecten.length} objecten)</td>
          <td style="padding:12px 0 0;font-weight:bold;font-size:15px;text-align:right;color:${BRAND.oranjeDk};">${euroCents(d.totaal)}</td></tr>
    </table>
    <p style="margin:22px 0 8px;">${btn(d.betaalUrl, "Betaal deze factuur")}</p>
    <p style="line-height:1.5;color:${BRAND.grijs};font-size:12px;word-break:break-all;">Werkt de knop niet? Betaal via: ${d.betaalUrl}</p>
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;margin-top:14px;">Je betaalt eenvoudig en direct via iDEAL. Na betaling ontvang je automatisch een bevestiging.</p>`;
  return { onderwerp: `Factuur ${d.factuurnummer} — advertenties op Mooihuus`, html: layout("Factuur Mooihuus", inner) };
}

export function renderNieuwsbrief(
  post: { titel: string; intro: string; categorie: string; emoji: string; slug: string },
  opts: { afmeldUrl?: string; koop?: Listing[]; huur?: Listing[] } = {}
): { onderwerp: string; html: string } {
  const url = `${COMPANY.website}/blog/${post.slug}`;
  const koop = opts.koop || [];
  const huur = opts.huur || [];
  const heeftWoningen = koop.length > 0 || huur.length > 0;
  const inner = `
    <div style="font-size:12px;font-weight:bold;color:${BRAND.oranjeDk};text-transform:uppercase;letter-spacing:.04em;">${post.emoji} ${post.categorie}</div>
    <h1 style="font-size:23px;color:${BRAND.bosgroenDk};margin:6px 0 10px;">${post.titel}</h1>
    <p style="line-height:1.6;">${post.intro}</p>
    <p style="margin:20px 0;">${btn(url, "Lees het hele artikel")}</p>
    ${heeftWoningen ? `<div style="border-top:1px solid ${BRAND.lijn};margin:24px 0 0;"></div>
    <h2 style="font-size:18px;color:${BRAND.bosgroenDk};margin:20px 0 0;">🏡 Uit ons aanbod</h2>
    ${woningenBlok("Te koop", koop)}
    ${woningenBlok("Te huur", huur)}
    <p style="margin:22px 0;">${btn(`${COMPANY.website}/`, "Bekijk het hele aanbod")}</p>` : ""}
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;border-top:1px solid ${BRAND.lijn};padding-top:16px;">Je ontvangt deze mail omdat je je hebt aangemeld voor de Mooihuus-nieuwsbrief.${opts.afmeldUrl ? ` <a href="${opts.afmeldUrl}" style="color:${BRAND.grijs};">Afmelden</a>.` : ""}</p>`;
  return { onderwerp: `${post.emoji} ${post.titel} — Mooihuus`, html: layout(post.titel, inner) };
}

export function renderBezichtiging(
  listing: { titel: string; id: string },
  d: { naam: string; email: string; datum: string; tijd: string; bericht: string }
): { onderwerp: string; html: string } {
  const url = `${COMPANY.website}/aanbod/${listing.id}`;
  const inner = `
    <h1 style="font-size:22px;color:${BRAND.bosgroenDk};margin:0 0 10px;">Nieuw bezichtigingsverzoek</h1>
    <p style="line-height:1.6;">Voor je woning <strong>${listing.titel}</strong> is een bezichtiging aangevraagd.</p>
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:14px 0;">
      <tr><td style="padding:6px 0;color:${BRAND.grijs};">Naam</td><td style="padding:6px 0;font-weight:bold;">${d.naam}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.grijs};">E-mail</td><td style="padding:6px 0;font-weight:bold;">${d.email}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.grijs};">Voorkeursdatum</td><td style="padding:6px 0;font-weight:bold;">${d.datum} ${d.tijd}</td></tr>
    </table>
    ${d.bericht ? `<p style="line-height:1.6;">&ldquo;${d.bericht}&rdquo;</p>` : ""}
    <p style="line-height:1.6;color:${BRAND.grijs};font-size:13px;">Let op: dit is een <strong>verzoek</strong>, nog geen bevestigde afspraak. Neem contact op met de aanvrager om de bezichtiging te bevestigen.</p>
    <p style="margin:18px 0;">${btn(url, "Bekijk de woning")}</p>`;
  return { onderwerp: `Bezichtigingsverzoek: ${listing.titel}`, html: layout("Bezichtigingsverzoek", inner) };
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
