// Automatische blog-generator. Schrijft één nieuw artikel in Mooihuus-stijl met
// de Anthropic-API (zelfde key als de chat/vertaling). Wordt aangeroepen door de
// interne scheduler (wekelijks) en door /api/cron/blog (handmatig).
//
// Let op: we vragen bewust GEEN JSON terug. Een lang Markdown-artikel met echte
// regeleindes in een JSON-string maakt de JSON ongeldig. Daarom een simpel
// veld-gescheiden tekstformaat dat we betrouwbaar kunnen parsen.

import type { BlogPost } from "./blog";

function slugify(titel: string): string {
  return titel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function veld(tekst: string, label: string): string {
  const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im");
  const m = tekst.match(re);
  return m ? m[1].trim() : "";
}

export async function genereerBlogpost(
  bestaandeTitels: string[],
  kleurIndex: number,
  nu: Date = new Date()
): Promise<BlogPost | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const system =
    `Je bent de contentredacteur van Mooihuus.nl, hét onafhankelijke platform voor recreatiewoningen in Nederland. ` +
    `Schrijf één nieuw, origineel blogartikel in het Nederlands over recreatiewoningen — denk aan kopen, bezitten, ` +
    `onderhouden, verhuren, verzekeren, financieren, fiscaal (box 3), erfpacht/eigen grond, permanent wonen, parkkosten, ` +
    `duurzaamheid of inrichting.\n\n` +
    `Toon: nuchter, behulpzaam, deskundig, je/jij. Lengte 500–800 woorden. Sluit af met een zachte, natuurlijke ` +
    `verwijzing naar Mooihuus (je huus te koop/huur zetten) en/of de Huusmeesters (klus- en onderhoudshulp) — subtiel, ` +
    `geen schreeuwerige verkoop. Geef geen fiscaal/juridisch advies als absolute waarheid; noem bedragen en tarieven als ` +
    `indicatie en verwijs voor de eigen situatie naar een adviseur.\n\n` +
    `Kies een onderwerp dat duidelijk VERSCHILT van deze bestaande titels: ${bestaandeTitels.join(" | ")}.\n\n` +
    `Geef je antwoord EXACT in dit formaat, met deze labels op eigen regels:\n` +
    `TITEL: <de titel>\n` +
    `CATEGORIE: <één korte categorie, bijv. Kennis, Verhuur, Financieel, Fiscaal, Tips & onderhoud, Kopen>\n` +
    `EMOJI: <één passende emoji>\n` +
    `INTRO: <samenvatting van 1 à 2 zinnen>\n` +
    `BODY:\n` +
    `<het volledige artikel in Markdown, met een paar "## " kopjes en waar passend een opsomming. Meerdere alinea's mag.>\n\n` +
    `Zet niets vóór TITEL en gebruik de labels exact zoals hierboven.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.BLOG_MODEL || process.env.CHAT_MODEL || "claude-3-5-sonnet-latest",
        max_tokens: 2600,
        temperature: 0.7,
        system,
        messages: [{ role: "user", content: "Schrijf het blogartikel van deze week." }],
      }),
    }).finally(() => clearTimeout(timer));
    const data = await res.json();
    const raw: string = data?.content?.[0]?.text || "";
    if (!raw.trim()) return null;

    const titel = veld(raw, "TITEL");
    const bodyMatch = raw.match(/^\s*BODY\s*:\s*\n?([\s\S]*)$/im);
    const body = bodyMatch ? bodyMatch[1].trim() : "";
    if (!titel || !body) return null;

    return {
      slug: slugify(titel),
      titel: titel.slice(0, 140),
      categorie: (veld(raw, "CATEGORIE") || "Kennis").slice(0, 40),
      emoji: (veld(raw, "EMOJI") || "🌲").slice(0, 6),
      kleur: ((kleurIndex % 6) + 6) % 6,
      datum: nu.toISOString(),
      intro: veld(raw, "INTRO").slice(0, 400),
      body,
    };
  } catch {
    return null;
  }
}
