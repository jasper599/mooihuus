import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TAAL: Record<string, string> = { en: "English", de: "German", nl: "Dutch" };

// Vaste vertalingen van vakspecifieke termen, zodat de vertaling consistent en
// correct blijft (een generieke vertaler maakt hier vaak fouten van).
const GLOSSARY: Record<"en" | "de", Record<string, string>> = {
  en: {
    recreatiewoning: "holiday home",
    vakantiewoning: "holiday home",
    recreatiepark: "holiday park",
    vakantiepark: "holiday park",
    chalet: "chalet",
    stacaravan: "static caravan / mobile home",
    "eigen grond": "freehold land (owned plot)",
    erfpacht: "leasehold (ground lease)",
    canon: "ground rent (leasehold fee)",
    parkbijdrage: "annual park contribution",
    servicekosten: "service charges",
    "k.k.": "buyer's costs not included (kosten koper)",
    "v.o.n.": "costs included (vrij op naam)",
    overdrachtsbelasting: "property transfer tax",
    bestemmingsplan: "zoning plan",
    "permanent wonen": "permanent residence",
    energielabel: "energy label",
    "te koop": "for sale",
    "te huur": "for rent",
  },
  de: {
    recreatiewoning: "Ferienhaus",
    vakantiewoning: "Ferienhaus",
    recreatiepark: "Ferienpark",
    vakantiepark: "Ferienpark",
    chalet: "Chalet",
    stacaravan: "Mobilheim",
    "eigen grond": "eigenes Grundstück (Eigentum)",
    erfpacht: "Erbpacht",
    canon: "Erbbauzins",
    parkbijdrage: "jährlicher Parkbeitrag",
    servicekosten: "Servicekosten",
    "k.k.": "Käuferkosten nicht inbegriffen (kosten koper)",
    "v.o.n.": "Kosten inbegriffen (vrij op naam)",
    overdrachtsbelasting: "Grunderwerbsteuer",
    bestemmingsplan: "Bebauungsplan",
    "permanent wonen": "Dauerwohnen",
    energielabel: "Energielabel",
    "te koop": "zu verkaufen",
    "te huur": "zu vermieten",
  },
};

function glossaryHint(taal: "en" | "de", text: string): string {
  const low = text.toLowerCase();
  const paren = Object.entries(GLOSSARY[taal])
    .filter(([nl]) => low.includes(nl))
    .map(([nl, tgt]) => `- "${nl}" → ${tgt}`);
  return paren.length ? `\n\nUse these exact terms where they appear:\n${paren.join("\n")}` : "";
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").slice(0, 4000);
  const taal = TAAL[String(b.taal)] ? String(b.taal) : "en";
  if (!text.trim()) return NextResponse.json({ error: "Geen tekst." }, { status: 400 });
  if (taal === "nl") return NextResponse.json({ vertaald: text });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ vertaald: text, zonderKey: true });
  }

  const doel = taal as "en" | "de";
  const system =
    `You are a professional real-estate translator for a Dutch marketplace of holiday homes ` +
    `(recreatiewoningen). Translate the property listing from Dutch into ${TAAL[doel]}.\n\n` +
    `Rules:\n` +
    `- Translate meaning, not word-for-word. The result must read like it was written by a native ${TAAL[doel]} estate agent: natural, warm, fluent.\n` +
    `- Keep the same structure, paragraphs and line breaks.\n` +
    `- Do NOT translate proper names: park names, place names, brand names, and personal names stay as-is.\n` +
    `- Keep numbers, prices, measurements and units exactly (e.g. "€ 89.000", "65 m²", "4 personen" → 4 people/Personen). Use a comma or point per the target language's convention but never change the value.\n` +
    `- Preserve real-estate abbreviations by translating their meaning (see glossary) rather than leaving cryptic Dutch codes.\n` +
    `- Do not invent facts, guarantees or features that are not in the source.\n` +
    `- Return ONLY the translation. No preamble, no quotes, no notes.` +
    glossaryHint(doel, text);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: controller.signal,
      body: JSON.stringify({
        // Sonnet vertaalt merkbaar accurater dan Haiku; overschrijfbaar via env.
        model: process.env.VERTAAL_MODEL || process.env.CHAT_MODEL || "claude-3-5-sonnet-latest",
        max_tokens: 1500,
        temperature: 0.2,
        system,
        messages: [{ role: "user", content: text }],
      }),
    }).finally(() => clearTimeout(timer));
    const data = await res.json();
    let vertaald = data?.content?.[0]?.text;
    if (typeof vertaald === "string" && vertaald.trim()) {
      vertaald = vertaald.trim().replace(/^["'`]|["'`]$/g, "");
      return NextResponse.json({ vertaald });
    }
    return NextResponse.json({ vertaald: text, fout: true });
  } catch {
    return NextResponse.json({ vertaald: text, fout: true });
  }
}
