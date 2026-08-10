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

// Ruimt AI-output op: strip omringende aanhalingstekens, knip te lang af, en
// borg dat prijs, locatie en de merknaam echt in de caption staan.
function normaliseer(tekst: string, listing: Listing): string {
  let t = (tekst || "").trim().replace(/^["'“”«»]+|["'“”«»]+$/g, "").trim();
  if (!t) return socialCaptionTemplate(listing);
  if (t.length > MAX) t = t.slice(0, MAX).trim();

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
    `- Sluit af met een uitnodiging om de woning op Mooihuus.nl te bekijken ("link in bio").\n` +
    `- GEEN hashtags. GEEN verzonnen kenmerken. GEEN beloftes over rendement of waardestijging. GEEN telefoonnummers of externe links.\n` +
    `- Maximaal ~110 woorden.\n\n` +
    `Geef ALLEEN de kale caption terug — geen aanhalingstekens, geen kop, geen toelichting.`;

  const r = await vraagAnthropic(key, {
    system,
    messages: [{ role: "user", content: `Woninggegevens:\n${feiten}\n\nSchrijf de caption.` }],
    max_tokens: 400,
    temperature: 0.85,
    voorkeur: "haiku",
    envModel: process.env.SOCIAL_MODEL || process.env.CHAT_MODEL,
    timeoutMs: 20000,
    nuMs: nu.getTime(),
  });
  if (!r.text) return socialCaptionTemplate(listing);
  return normaliseer(r.text, listing);
}
