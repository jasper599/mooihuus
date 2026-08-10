// Automatische blog-generator. Schrijft één nieuw artikel in Mooihuus-stijl met
// de Anthropic-API (zelfde key als de chat/vertaling). Wordt aangeroepen door de
// interne scheduler (wekelijks) en door /api/cron/blog (handmatig).

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
    `Toon: nuchter, behulpzaam, deskundig, je/jij. Gebruik Markdown met een paar "## " kopjes en waar passend een opsomming. ` +
    `Lengte 500–800 woorden. Sluit af met een zachte, natuurlijke verwijzing naar Mooihuus (je huus te koop/huur zetten) ` +
    `en/of de Huusmeesters (klus- en onderhoudshulp) — subtiel, geen schreeuwerige verkoop. ` +
    `Geef geen fiscaal/juridisch advies als absolute waarheid; noem bedragen en tarieven als indicatie en verwijs voor de ` +
    `eigen situatie naar een adviseur.\n\n` +
    `Kies een onderwerp dat duidelijk VERSCHILT van deze bestaande titels: ${bestaandeTitels.join(" | ")}.\n\n` +
    `Antwoord met ALLEEN geldige JSON, zonder tekst eromheen: ` +
    `{"titel":"...","categorie":"...","emoji":"...","intro":"...","body":"..."}. ` +
    `"body" is het volledige artikel in Markdown, "intro" een samenvatting van 1–2 zinnen, "emoji" één passende emoji, ` +
    `"categorie" kort (bijv. Kennis, Verhuur, Financieel, Fiscaal, Tips & onderhoud, Kopen).`;

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
    const raw = data?.content?.[0]?.text || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]);
    if (!o.titel || !o.body) return null;

    return {
      slug: slugify(String(o.titel)),
      titel: String(o.titel).slice(0, 140),
      categorie: String(o.categorie || "Kennis").slice(0, 40),
      emoji: String(o.emoji || "🌲").slice(0, 6),
      kleur: ((kleurIndex % 6) + 6) % 6,
      datum: nu.toISOString(),
      intro: String(o.intro || "").slice(0, 400),
      body: String(o.body),
    };
  } catch {
    return null;
  }
}
