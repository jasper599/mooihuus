import { NextResponse } from "next/server";
import { vraagAnthropic } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ------------------------------------------------------------------
// AI-teksthulp voor "Plaats je huus": schrijft een pakkende titel en een
// wervende, eerlijke advertentietekst in Mooihuus-stijl op basis van de
// ingevoerde kenmerken. Gebruikt de robuuste vraagAnthropic (probeert
// meerdere modellen) en valt ALTIJD terug op een net sjabloon, zodat het
// plaatsen nooit blokkeert.
// ------------------------------------------------------------------

function veld(tekst: string, label: string): string {
  const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im");
  const m = tekst.match(re);
  return m ? m[1].trim() : "";
}

function sjabloon(f: any): { titel: string; omschrijving: string; prijsindicatie: string } {
  const type = String(f.type ?? "woning").toLowerCase();
  const prov = String(f.provincie ?? "Nederland");
  const pers = f.personen ?? 4;
  const park = f.park ?? "";
  const prijs = Number(f.prijs ?? 0);
  const titel = `Sfeervolle ${type} in ${prov} — jouw tweede thuis`;
  const omschrijving =
    `Kom thuis in deze ${type}${park ? ` op ${park}` : ""} in ${prov}. ` +
    `Ruimte voor ${pers} personen, midden in het groen en heerlijk rustig gelegen. ` +
    `Zet de deuren open, ruik de buitenlucht en kom tot rust — dit is de plek waar vakantie ` +
    `vanzelf begint. Instapklaar en met alle comfort binnen handbereik.`;
  const lo = Math.round((prijs * 0.95) / 1000) * 1000;
  const hi = Math.round((prijs * 1.08) / 1000) * 1000;
  const prijsindicatie = prijs
    ? `Vergelijkbare woningen in ${prov} staan rond € ${lo.toLocaleString("nl-NL")} – € ${hi.toLocaleString("nl-NL")}. Jouw vraagprijs valt daar mooi binnen. Jij beslist.`
    : "";
  return { titel, omschrijving, prijsindicatie };
}

export async function POST(req: Request) {
  const f = await req.json().catch(() => ({}));
  const terugval = sjabloon(f);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json(terugval);

  const doelWoord = f.doel === "huur" ? "te huur" : "te koop";
  const uitjes = Array.isArray(f.uitjes) ? f.uitjes.filter(Boolean) : [];
  const feiten = [
    `Type: ${f.type || "recreatiewoning"}`,
    `Aanbod: ${doelWoord}`,
    f.provincie ? `Provincie: ${f.provincie}` : "",
    f.park ? `Park/plaats: ${f.park}` : "",
    f.personen ? `Max. personen: ${f.personen}` : "",
    f.m2 ? `Woonoppervlak: ${f.m2} m²` : "",
    f.grond ? `Grond: ${f.grond}` : "",
    uitjes.length ? `In de buurt: ${uitjes.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const system =
    `Je schrijft advertentieteksten voor Mooihuus.nl, hét platform voor recreatiewoningen in Nederland. ` +
    `Toon: warm, nuchter, uitnodigend, je/jij. Schrijf in het Nederlands.\n\n` +
    `Maak op basis van de kenmerken:\n` +
    `- Een pakkende TITEL (max ~70 tekens) die het type en de plek noemt. Geen clichés als "jouw tweede thuis".\n` +
    `- Een wervende maar EERLIJKE OMSCHRIJVING van 120–200 woorden. Gebruik alleen de gegeven kenmerken — verzin geen voorzieningen, oppervlaktes of feiten.\n\n` +
    `Strikte regels:\n` +
    `- GEEN beloftes over rendement, huurinkomsten of waardestijging.\n` +
    `- GEEN telefoonnummers, e-mailadressen, externe links of parknamen van derden als "boek hier".\n` +
    `- Geen overdreven superlatieven; blijf geloofwaardig.\n\n` +
    `Geef je antwoord EXACT in dit formaat:\n` +
    `TITEL: <de titel>\n` +
    `OMSCHRIJVING:\n<de omschrijving, mag meerdere alinea's>\n\n` +
    `Zet niets vóór TITEL.`;

  const r = await vraagAnthropic(key, {
    system,
    messages: [{ role: "user", content: `Kenmerken:\n${feiten}\n\nSchrijf de titel en omschrijving.` }],
    max_tokens: 700,
    temperature: 0.8,
    voorkeur: "sonnet",
    envModel: process.env.AI_MODEL || process.env.CHAT_MODEL,
    timeoutMs: 30000,
  });

  const raw = r.text || "";
  const titel = veld(raw, "TITEL");
  const bodyMatch = raw.match(/^\s*OMSCHRIJVING\s*:\s*\n?([\s\S]*)$/im);
  const omschrijving = bodyMatch ? bodyMatch[1].trim() : "";
  if (!titel || !omschrijving) return NextResponse.json(terugval);

  return NextResponse.json({
    titel: titel.slice(0, 140),
    omschrijving: omschrijving.slice(0, 2000),
    prijsindicatie: terugval.prijsindicatie,
  });
}
