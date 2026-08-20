// Instagram-caption voor een woning. Schrijft een pakkende, nette caption met
// de AI (zelfde motor als blog/chat/vertaling) en valt ALTIJD terug op een net
// sjabloon, zodat een bestelling nooit blijft hangen op een mislukte AI-aanroep.
//
// Uitgangspunten (op verzoek): prijs en locatie staan er altijd in, en de
// eerste regel is een korte hook die op zichzelf werkt — Instagram kapt de rest
// af, dus de opening moet meteen prikkelen (geen kale, lange woningtitel).

import type { Listing } from "./types";
import { euro, prijsSuffix } from "./format";
import { vraagAnthropic } from "./anthropic";

const MAX = 700;

function locatie(listing: Listing): string {
  const delen = [listing.park, listing.provincie].map((s) => (s || "").trim()).filter(Boolean);
  return Array.from(new Set(delen)).join(", ");
}

function prijsTekst(listing: Listing): string {
  const s = prijsSuffix(listing);
  const bedrag = euro(listing.prijs);
  return s ? `${bedrag} ${s}` : bedrag;
}

function kenmerkenLijst(listing: Listing): string[] {
  const k: string[] = [];
  if (listing.slaapkamers) k.push(`${listing.slaapkamers} slaapkamer${listing.slaapkamers === 1 ? "" : "s"}`);
  if (listing.personen) k.push(`${listing.personen} personen`);
  if (listing.m2) k.push(`${listing.m2} m²`);
  return k;
}

// Nette, deterministische terugval-caption. Altijd bruikbaar, ook zonder AI.
export function socialCaptionTemplate(listing: Listing): string {
  const doelWoord = listing.doel === "huur" ? "te huur" : "te koop";
  const loc = locatie(listing);
  const locZin = loc ? ` in ${loc}` : "";
  const type = (listing.type || "recreatiewoning").toLowerCase();
  const kenmerken = kenmerkenLijst(listing);
  const regels = [
    `✨ Nieuw ${doelWoord}: ${type}${locZin}`,
    "",
    kenmerken.length ? `🏡 ${kenmerken.join(" · ")}` : "",
    `💶 ${prijsTekst(listing)}`,
    "",
    "👉 Bekijk 'm nu op Mooihuus.nl (link in bio)",
  ].filter((r) => r !== "");
  return regels.join("\n");
}

// Knipt tekst netjes in op ~max tekens: bij voorkeur op een zin-einde, anders
// op een spatie — nooit middenin een woord.
function nettInkorten(t: string, max: number): string {
  if (t.length <= max) return t;
  const stuk = t.slice(0, max);
  const zinEinde = Math.max(stuk.lastIndexOf(". "), stuk.lastIndexOf("!\n"), stuk.lastIndexOf("!"), stuk.lastIndexOf("?"), stuk.lastIndexOf("\n"));
  if (zinEinde > max * 0.5) return stuk.slice(0, zinEinde + 1).trim();
  const spatie = stuk.lastIndexOf(" ");
  return (spatie > 0 ? stuk.slice(0, spatie) : stuk).trim();
}

// Ruimt AI-output op: strip omringende aanhalingstekens en uitgeschreven of
// afgekapte links, knip te lang netjes af, en borg dat prijs, locatie en de
// merknaam echt in de caption staan.
function normaliseer(tekst: string, listing: Listing): string {
  let t = (tekst || "").trim().replace(/^["'“”«»]+|["'“”«»]+$/g, "").trim();
  if (!t) return socialCaptionTemplate(listing);

  // Haal uitgeschreven links weg (ook halve/afgekapte): volledige URL's, www-
  // adressen en domein-met-pad zoals "mooihuus.nl/aanbod/…". De kale merknaam
  // "Mooihuus.nl" (zonder pad) blijft staan voor de nette CTA.
  t = t
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\b[a-z0-9-]+\.(?:nl|com|net|eu|be|de|org)\/\S*/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Los verbindingswoordje dat kan achterblijven waar een link stond ("… op").
  t = t.replace(/[ \t]*(?:\b(?:op|naar|via|bij|voor|op naar)\b)[ \t]*[.!:–—-]*$/i, "").trim();
  if (!t) return socialCaptionTemplate(listing);
  if (t.length > MAX) t = nettInkorten(t, MAX);

  const loc = locatie(listing);
  const extra: string[] = [];
  // Locatie borgen (alleen als er een plaats/park bekend is en die ontbreekt).
  if (loc && !t.toLowerCase().includes((listing.provincie || "").toLowerCase().trim()) &&
      !t.toLowerCase().includes((listing.park || "").toLowerCase().trim())) {
    extra.push(`📍 ${loc}`);
  }
  // Prijs borgen.
  const bedragKaal = euro(listing.prijs).replace(/\s/g, "");
  if (!t.replace(/\s/g, "").includes(bedragKaal)) {
    extra.push(`💶 ${prijsTekst(listing)}`);
  }
  if (extra.length) t += "\n\n" + extra.join("\n");
  // Merknaam / CTA borgen.
  if (!/mooihuus\.nl/i.test(t)) t += "\n\n👉 Bekijk 'm op Mooihuus.nl (link in bio)";
  return t;
}

// AI-caption met terugval. Geeft ALTIJD een bruikbare caption terug (gooit nooit).
export async function genereerSocialCaption(listing: Listing, nu: Date = new Date()): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return socialCaptionTemplate(listing);

  const doelWoord = listing.doel === "huur" ? "te huur" : "te koop";
  const feiten = [
    `Type: ${listing.type || "recreatiewoning"}`,
    `Aanbod: ${doelWoord}`,
    locatie(listing) ? `Locatie: ${locatie(listing)}` : "",
    `Prijs: ${prijsTekst(listing)}`,
    listing.slaapkamers ? `Slaapkamers: ${listing.slaapkamers}` : "",
    listing.personen ? `Max. personen: ${listing.personen}` : "",
    listing.m2 ? `Woonoppervlak: ${listing.m2} m²` : "",
    listing.bouwjaar ? `Bouwjaar: ${listing.bouwjaar}` : "",
  ].filter(Boolean).join("\n");

  const system =
    `Je schrijft de Instagram-caption voor Mooihuus.nl, hét onafhankelijke platform voor recreatiewoningen in Nederland. ` +
    `Toon: warm, nuchter, uitnodigend, je/jij. Schrijf in het Nederlands.\n\n` +
    `Eisen aan de caption:\n` +
    `- Begin met ÉÉN korte, pakkende openingszin (max ~90 tekens) die op zichzelf al werkt. Instagram kapt de rest af, dus die eerste regel moet meteen prikkelen. Neem NIET klakkeloos de woningtitel over.\n` +
    `- Noem duidelijk de PRIJS en de LOCATIE (plaats/park/provincie).\n` +
    `- Kort en scanbaar: korte regels, hooguit een paar passende emoji (niet overdrijven).\n` +
    `- Sluit af met een uitnodiging om de woning op Mooihuus.nl te bekijken, met exact de tekst "link in bio".\n` +
    `- Schrijf NOOIT een volledige URL of webadres uit (dus niet "mooihuus.nl/..." of "https://..."). Noem alleen de merknaam "Mooihuus.nl" en "link in bio".\n` +
    `- GEEN hashtags. GEEN verzonnen kenmerken. GEEN beloftes over rendement of waardestijging. GEEN telefoonnummers.\n` +
    `- Maak elke zin volledig af; eindig niet halverwege een zin of woord.\n` +
    `- Maximaal ~110 woorden.\n\n` +
    `Geef ALLEEN de kale caption terug — geen aanhalingstekens, geen kop, geen toelichting.`;

  const r = await vraagAnthropic(key, {
    system,
    messages: [{ role: "user", content: `Woninggegevens:\n${feiten}\n\nSchrijf de caption.` }],
    max_tokens: 600,
    temperature: 0.85,
    voorkeur: "haiku",
    envModel: process.env.SOCIAL_MODEL || process.env.CHAT_MODEL,
    timeoutMs: 20000,
    nuMs: nu.getTime(),
  });
  if (!r.text) return socialCaptionTemplate(listing);
  return normaliseer(r.text, listing);
}
