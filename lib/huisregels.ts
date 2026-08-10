// Huisregels-handhaving voor advertentieteksten.
//
// Twee lagen:
//  1. Snelle, deterministische regex-controle (telefoon, e-mail, links, social,
//     gegarandeerde rendementen, doorverwijzingen). Dit is de harde poort.
//  2. Optionele AI-controle (met ANTHROPIC_API_KEY) die subtielere overtredingen
//     en context vangt — bijv. het verschil tussen een verboden huurgarantie en
//     een toegestane prognose-met-disclaimer.
//
// De regels sluiten aan op de algemene voorwaarden (sectie 4, huisregels).

import { beschikbareModellen, kiesModel } from "./anthropic";

export type HuisregelResultaat = {
  ok: boolean;              // true = geen blokkerende overtredingen
  problemen: string[];      // blokkerend — plaatsen/opslaan wordt tegengehouden
  waarschuwingen: string[]; // niet-blokkerend — voor review in de backoffice
};

type Regel = { test: RegExp; melding: string };

// Blokkerende regels.
const BLOK: Regel[] = [
  {
    test: /(\+?31[\s-]?|0)6[\s-]?\d(?:[\s-]?\d){7}/,
    melding: "Geen telefoonnummer in de tekst — aanvragen lopen via Mooihuus.",
  },
  {
    test: /\b0\d{1,3}[\s-]?\d{6,7}\b/,
    melding: "Geen (vast) telefoonnummer in de tekst — aanvragen lopen via Mooihuus.",
  },
  {
    test: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    melding: "Geen e-mailadres in de tekst — aanvragen lopen via Mooihuus.",
  },
  {
    test: /(https?:\/\/|www\.)\S+/i,
    melding: "Geen website/link in de tekst — aanvragen lopen via Mooihuus.",
  },
  {
    // Kale domeinnamen zoals "voorbeeldmakelaar.nl" (doorverwijzing).
    test: /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(nl|com|eu|de|be|net|org|info)\b/i,
    melding: "Geen verwijzing naar een externe website — aanvragen lopen via Mooihuus.",
  },
  {
    test: /\b(instagram|facebook|tiktok|linkedin|youtube|whatsapp|@[a-z0-9_.]{3,})\b/i,
    melding: "Geen verwijzing naar social media of externe accounts.",
  },
  {
    test: /(bel|app|whatsapp|mail|sms)\s+(ons|mij|me|even|direct|gerust)/i,
    melding: "Geen oproep om rechtstreeks contact op te nemen (bel/app/mail ons).",
  },
  {
    test: /gegarandeerd\w*\s+(rendement|huur\w*|opbrengst|inkomsten|winst)/i,
    melding: "Geen gegarandeerd rendement of gegarandeerde huuropbrengst — niet toegestaan.",
  },
  {
    test: /(rendement|huuropbrengst|huurinkomsten|opbrengst)\s+\w*\s*gegarandeerd/i,
    melding: "Geen gegarandeerd rendement of gegarandeerde huuropbrengst — niet toegestaan.",
  },
  {
    test: /\b(huurgarantie|huurrendement\s+gegarandeerd|verzekerd\s+rendement)\b/i,
    melding: "Geen huurgarantie of verzekerd rendement — niet toegestaan.",
  },
  {
    test: /gegarandeerde?\s+\d{1,2}([.,]\d+)?\s?%/i,
    melding: "Geen gegarandeerd rendementspercentage — niet toegestaan.",
  },
  {
    test: /\d{1,2}([.,]\d+)?\s?%\s+(rendement\s+)?(gegarandeerd|per\s+jaar\s+gegarandeerd)/i,
    melding: "Geen gegarandeerd rendementspercentage — niet toegestaan.",
  },
  {
    test: /(ook|tevens)\s+te\s+koop\s+(bij|via)\b/i,
    melding: "Geen doorverwijzing naar een andere aanbieder of platform.",
  },
  {
    test: /(kijk|meer\s+(info|informatie|foto\w*))\s+(op|via)\s+(onze|ons|mijn|de)\s+(eigen\s+)?(site|website|kantoor)/i,
    melding: "Geen doorverwijzing naar een eigen/externe website.",
  },
];

// Niet-blokkerende signalen — worden gemarkeerd voor review.
const MARKEER: Regel[] = [
  {
    test: /\b(rendement|huuropbrengst|huurinkomsten|verwacht\w*\s+opbrengst)\b/i,
    melding: "Bevat een rendement-/opbrengstclaim. Toegestaan als prognose, maar zet er duidelijk bij dat het een indicatie is en geen garantie.",
  },
  {
    test: /\b(makelaarskantoor|ons\s+kantoor|onze\s+makelaar)\b/i,
    melding: "Verwijzing naar een kantoor/makelaar — controleer of dit geen doorverwijzing is.",
  },
];

function scan(tekst: string): HuisregelResultaat {
  const problemen: string[] = [];
  const waarschuwingen: string[] = [];
  for (const r of BLOK) if (r.test.test(tekst) && !problemen.includes(r.melding)) problemen.push(r.melding);
  for (const r of MARKEER) if (r.test.test(tekst) && !waarschuwingen.includes(r.melding)) waarschuwingen.push(r.melding);
  return { ok: problemen.length === 0, problemen, waarschuwingen };
}

// Optionele AI-laag: vangt subtiele doorverwijzingen/garanties die de regex mist.
async function scanAI(tekst: string): Promise<{ problemen: string[]; waarschuwingen: string[] }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { problemen: [], waarschuwingen: [] };
  const modellen = await beschikbareModellen(key, Date.now());
  const model = process.env.HUISREGELS_MODEL || kiesModel(modellen, "haiku");
  if (!model) return { problemen: [], waarschuwingen: [] };
  const system =
    `Je bent de contentmoderator van Mooihuus, een platform voor recreatiewoningen. ` +
    `Beoordeel een advertentietekst tegen de huisregels en geef ALLEEN geldige JSON terug: ` +
    `{"problemen":[],"waarschuwingen":[]}.\n` +
    `Blokkeer (in "problemen") als de tekst: (a) contactgegevens bevat (telefoon, e-mail, website, social) ` +
    `waarmee de koper om Mooihuus heen wordt geleid; (b) doorverwijst naar een eigen/externe site, ander ` +
    `platform of andere aanbieder; (c) een gegarandeerd rendement of gegarandeerde huuropbrengst belooft.\n` +
    `Zet in "waarschuwingen": rendement-/opbrengstprognoses zonder duidelijke 'geen garantie'-disclaimer, ` +
    `of subtiele kantoorpromotie. Een prognose mét disclaimer is toegestaan (geen probleem, geen waarschuwing). ` +
    `Elke melding is één korte Nederlandse zin. Geen extra tekst buiten de JSON.`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        max_tokens: 400,
        temperature: 0,
        system,
        messages: [{ role: "user", content: tekst.slice(0, 4000) }],
      }),
    }).finally(() => clearTimeout(timer));
    const data = await res.json();
    const raw = data?.content?.[0]?.text || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return { problemen: [], waarschuwingen: [] };
    const parsed = JSON.parse(m[0]);
    const arr = (x: any) => (Array.isArray(x) ? x.filter((s) => typeof s === "string").slice(0, 8) : []);
    return { problemen: arr(parsed.problemen), waarschuwingen: arr(parsed.waarschuwingen) };
  } catch {
    return { problemen: [], waarschuwingen: [] };
  }
}

// Hoofdfunctie: controleer titel + omschrijving. Regex is leidend; AI vult aan.
export async function handhaafHuisregels(velden: { titel?: string; omschrijving?: string }): Promise<HuisregelResultaat> {
  const tekst = [velden.titel || "", velden.omschrijving || ""].join("\n").trim();
  if (!tekst) return { ok: true, problemen: [], waarschuwingen: [] };

  const basis = scan(tekst);
  const ai = await scanAI(tekst);

  const problemen = Array.from(new Set([...basis.problemen, ...ai.problemen]));
  const waarschuwingen = Array.from(new Set([...basis.waarschuwingen, ...ai.waarschuwingen])).filter(
    (w) => !problemen.includes(w)
  );
  return { ok: problemen.length === 0, problemen, waarschuwingen };
}

// Synchronen variant (alleen regex) voor plekken zonder async/AI-behoefte.
export function controleerHuisregels(velden: { titel?: string; omschrijving?: string }): HuisregelResultaat {
  const tekst = [velden.titel || "", velden.omschrijving || ""].join("\n").trim();
  return tekst ? scan(tekst) : { ok: true, problemen: [], waarschuwingen: [] };
}
