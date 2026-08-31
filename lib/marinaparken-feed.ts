import { upsertFeedListing, sweepFeed, dedupliceerExterneWoningen } from "./db";
import type { Listing } from "./types";

// ------------------------------------------------------------------
// Marinaparken-huurfeed (BookingExperts XML). Haalt de accommodaties op,
// koppelt ze aan het juiste park voor de locatie, en zet ze als huur-woningen
// op Mooihuus met een doorklik naar Marinaparken (affiliate-tracking).
//
// Env-gestuurd, dus zonder deze variabelen doet de sync niets:
//   MARINAPARKEN_FEED_URL   — de accommodations-feed (bijv. .../feeds/accommodations.xml)
//   MARINAPARKEN_PARKS_URL  — (optioneel) de parks-feed, voor nette parknamen
//   MARINAPARKEN_TRACK      — (optioneel) affiliate-deeplink-basis; de doel-URL
//                             wordt er url-encoded achter geplakt (of op {url}).
// ------------------------------------------------------------------

const SOURCE = "marinaparken";
const BRON_LABEL = "via Marinaparken";

// --- Mini XML-helpers (geen dependency nodig voor deze platte feed) ---
function clean(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, "").trim();
}
function blocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}
function one(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? clean(m[1]) : "";
}
function many(block: string, tag: string): string[] {
  return blocks(block, tag).map(clean).filter(Boolean);
}

async function haal(url: string): Promise<string> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const res = await fetch(url, { signal: c.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function wrapTrack(url: string): string {
  const tpl = process.env.MARINAPARKEN_TRACK;
  if (!tpl) return url;
  if (tpl.includes("{url}")) return tpl.replace("{url}", encodeURIComponent(url));
  return tpl + encodeURIComponent(url);
}

function typeUit(categorie: string): string {
  const c = categorie.toLowerCase();
  if (/chalet/.test(c)) return "Chalet";
  if (/bungalow/.test(c)) return "Bungalow";
  if (/caravan|stacaravan/.test(c)) return "Stacaravan";
  if (/tent|glamp|safari|lodge/.test(c)) return "Glamping";
  if (/appartement|studio/.test(c)) return "Appartement";
  if (/house|huis|villa|woning/.test(c)) return "Vakantiehuis";
  return "Recreatiewoning";
}

interface Variatie { prijs: number; perNacht: number; url: string }
function variaties(product: string): Variatie[] {
  const out: Variatie[] = [];
  for (const v of blocks(product, "variation")) {
    const prijs = parseFloat(one(v, "price").replace(",", "."));
    if (!isFinite(prijs) || prijs <= 0) continue;
    const duur = parseInt(one(v, "duration"), 10) || 1;
    const soort = one(v, "durationType").toLowerCase();
    const nachten = /week/.test(soort) ? duur * 7 : duur;
    const perNacht = nachten > 0 ? prijs / nachten : prijs;
    out.push({ prijs, perNacht, url: one(v, "productURL") });
  }
  return out;
}

// Bouwt een city→parknaam-map uit de parken-feed (optioneel).
async function parkNamen(): Promise<Record<string, string>> {
  const url = process.env.MARINAPARKEN_PARKS_URL;
  if (!url) return {};
  try {
    const xml = await haal(url);
    const map: Record<string, string> = {};
    for (const p of blocks(xml, "product")) {
      const stad = one(p, "city").toLowerCase();
      const naam = one(p, "name");
      if (stad && naam) map[stad] = naam;
    }
    return map;
  } catch {
    return {};
  }
}

export interface SyncResultaat { overgeslagen?: boolean; verwerkt?: number; offline?: number; verborgen?: number; fout?: string }

export async function syncMarinaparken(): Promise<SyncResultaat> {
  const feed = process.env.MARINAPARKEN_FEED_URL;
  if (!feed) return { overgeslagen: true };
  try {
    const [xml, parken] = await Promise.all([haal(feed), parkNamen()]);
    const producten = blocks(xml, "product");
    const gezien: string[] = [];
    let i = 0;
    for (const p of producten) {
      const id = one(p, "id");
      if (!id) continue;
      const vars = variaties(p);
      if (!vars.length) continue; // geen prijs/beschikbaarheid → overslaan
      const goedkoopste = vars.slice().sort((a, b) => a.perNacht - b.perNacht)[0];
      const stad = one(p, "city");
      const provincie = one(p, "province") || one(p, "region") || "Nederland";
      const park = parken[stad.toLowerCase()] || stad || "Marinaparken";
      const fotos = many(p, "imageURL").slice(0, 12);
      const doelUrl = goedkoopste.url || one(p, "url");

      const data: Partial<Listing> = {
        doel: "huur",
        titel: one(p, "name") || "Vakantiewoning",
        type: typeUit(one(p, "categoryPath") || one(p, "categories") || one(p, "accommodationType")),
        provincie,
        park,
        personen: parseInt(one(p, "maxPersons"), 10) || 2,
        m2: 0,
        prijs: Math.max(1, Math.round(goedkoopste.perNacht)),
        prijsSuffix: "p.n.",
        omschrijving: one(p, "description"),
        fotos,
        kleur: i % 6,
        externalUrl: wrapTrack(doelUrl),
        bronLabel: BRON_LABEL,
        status: "live",
      };
      upsertFeedListing(SOURCE, id, data);
      gezien.push(id);
      i++;
    }
    const offline = sweepFeed(SOURCE, gezien);
    const verborgen = dedupliceerExterneWoningen();
    return { verwerkt: gezien.length, offline, verborgen };
  } catch (e: any) {
    return { fout: e?.message || "onbekende fout" };
  }
}

// Lichte throttle voor automatische sync vanaf de homepage (max 1× per 6 uur).
let laatsteSync = 0;
export function syncMarinaparkenIndienNodig(): void {
  if (!process.env.MARINAPARKEN_FEED_URL) return;
  const nu = Date.now();
  if (nu - laatsteSync < 6 * 60 * 60 * 1000) return;
  laatsteSync = nu;
  syncMarinaparken().catch(() => {});
}
