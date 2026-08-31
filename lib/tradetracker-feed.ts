import { upsertFeedListing, sweepFeed, dedupliceerExterneWoningen, bewaarFeeds } from "./db";
import type { Listing } from "./types";

// ------------------------------------------------------------------
// Generieke importer voor TradeTracker-productfeeds (type xml-v2).
// Deze feeds bevatten de tracking + de juiste woning-deeplink al in <URL>,
// dus er hoeft niets gewrapt te worden. Meerdere partners delen exact dit
// formaat (TopParken, en later Glampings/EuroParcs) — een nieuwe partner
// toevoegen = één regel in PARTNERS + de bijbehorende env-variabele zetten.
//
// Env per partner: <PREFIX>_FEED_URL = de pf.tradetracker.net-feed-URL.
// ------------------------------------------------------------------

interface Partner { source: string; bronLabel: string; env: string; uitsluitPark?: RegExp }

const PARTNERS: Partner[] = [
  { source: "topparken", bronLabel: "via TopParken", env: "TOPPARKEN_FEED_URL" },
  // Marinaparken-parken uit Glampings weglaten — die komen al via de directe
  // Marinaparken-feed (betere tracking, geen dubbele woningen). EuroParcs en
  // alle andere parken mogen wél gewoon via Glampings binnenkomen.
  { source: "glampings", bronLabel: "via Glampings.com", env: "GLAMPINGS_FEED_URL", uitsluitPark: /marina\s?parcs?|marinapark/i },
];

function clean(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, "").trim();
}
function tag(body: string, naam: string): string {
  const m = body.match(new RegExp(`<${naam}\\b[^>]*>([\\s\\S]*?)</${naam}>`));
  return m ? clean(m[1]) : "";
}
// Eerste <value> van een <property name="X">.
function prop(body: string, naam: string): string {
  const m = body.match(new RegExp(`<property name="${naam}">([\\s\\S]*?)</property>`));
  if (!m) return "";
  const v = m[1].match(/<value>([\s\S]*?)<\/value>/);
  return v ? clean(v[1]) : "";
}

// "€ 1.171,00" / "137,00" → 1171 / 137 (Europees: punt = duizendtal, komma = decimaal).
function euroNaarGetal(s: string): number {
  let t = (s || "").replace(/[^\d.,]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(t);
  return isFinite(n) ? n : 0;
}

function typeUit(cat: string): string {
  const c = cat.toLowerCase();
  if (/chalet/.test(c)) return "Chalet";
  if (/bungalow/.test(c)) return "Bungalow";
  if (/caravan|stacaravan/.test(c)) return "Stacaravan";
  if (/tent|glamp|safari|lodge/.test(c)) return "Glamping";
  if (/appartement|studio/.test(c)) return "Appartement";
  if (/villa|huis|woning|vakantiehuis/.test(c)) return "Vakantiehuis";
  return "Recreatiewoning";
}

async function haal(url: string): Promise<string> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 25000);
  try {
    const res = await fetch(url, { signal: c.signal, redirect: "follow", headers: { "user-agent": "MooihuusFeed/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export interface SyncResultaat { source: string; overgeslagen?: boolean; verwerkt?: number; offline?: number; fout?: string }

async function syncEen(p: Partner): Promise<SyncResultaat> {
  const url = process.env[p.env];
  if (!url) return { source: p.source, overgeslagen: true };
  try {
    const xml = await haal(url);
    const re = /<product\b[^>]*\bID="([^"]+)"[^>]*>([\s\S]*?)<\/product>/g;
    const gezien: string[] = [];
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(xml))) {
      const id = m[1];
      const body = m[2];
      const url2 = tag(body, "URL");
      if (!url2) continue;

      // Alleen Nederlands aanbod op Mooihuus. Het landveld verschilt per feed:
      // Glampings gebruikt "NL", TopParken "Nederland" — we accepteren beide.
      // Feeds zonder landveld passeren automatisch (aannemen: NL).
      const land = (prop(body, "country") + " " + prop(body, "country_name")).toLowerCase().trim();
      if (land && !/nederland|netherlands|\bnl\b|\bnld\b/.test(land)) continue;

      // Prijs per nacht — twee feed-varianten:
      //  - Glampings: price_indication is al de prijs per nacht (price_indication_per = "night").
      //  - TopParken: <price> is het totaal voor N nachten (uit price_explanation).
      const perProp = prop(body, "price_indication_per");
      const prijsInd = prop(body, "price_indication");
      let perNacht = 0;
      if (prijsInd && /night|nacht/i.test(perProp)) {
        perNacht = Math.round(euroNaarGetal(prijsInd));
      } else {
        const prijsRuw = euroNaarGetal(tag(body, "price"));
        const uitleg = prop(body, "price_explanation");
        const nachten = parseInt((uitleg.match(/(\d+)\s*nacht/i) || [])[1] || "3", 10) || 3;
        perNacht = prijsRuw > 0 ? Math.max(1, Math.round(prijsRuw / nachten)) : 0;
      }

      const catPath = (body.match(/<category\b[^>]*path="([^"]*)"/) || [])[1] || prop(body, "accommodationType");
      const foto = prop(body, "imageURL_accommodation") || prop(body, "imageURL_park") || prop(body, "image");
      const park = prop(body, "name_park") || prop(body, "Organization_name") || prop(body, "park") || prop(body, "city");
      // Overlap met een directe partnerfeed (bv. Marinaparken) overslaan.
      if (p.uitsluitPark && park && p.uitsluitPark.test(park)) continue;

      const data: Partial<Listing> = {
        doel: "huur",
        titel: tag(body, "name") || "Vakantiewoning",
        type: typeUit(catPath),
        provincie: prop(body, "province") || prop(body, "region") || "Nederland",
        park,
        personen: parseInt(prop(body, "maxPersons") || prop(body, "num_persons"), 10) || 2,
        m2: 0,
        prijs: perNacht || 1,
        prijsSuffix: "p.n.",
        omschrijving: prop(body, "descriptionShort") || tag(body, "description").slice(0, 400),
        fotos: foto ? [foto] : [],
        kleur: i % 6,
        externalUrl: url2,
        bronLabel: p.bronLabel,
        status: "live",
      };
      upsertFeedListing(p.source, id, data, false); // batch: nog niet wegschrijven
      gezien.push(id);
      i++;
    }
    const offline = sweepFeed(p.source, gezien, false); // batch
    bewaarFeeds(); // één keer wegschrijven na alle woningen van deze partner
    return { source: p.source, verwerkt: gezien.length, offline };
  } catch (e: any) {
    return { source: p.source, fout: e?.message || "onbekende fout" };
  }
}

export async function syncAlleTradeTracker(): Promise<SyncResultaat[]> {
  const res: SyncResultaat[] = [];
  for (const p of PARTNERS) res.push(await syncEen(p));
  dedupliceerExterneWoningen();
  return res;
}

// Lichte throttle voor automatische sync vanaf de homepage (max 1x per 6 uur).
let laatste = 0;
export function syncTradeTrackerIndienNodig(): void {
  if (!PARTNERS.some((p) => process.env[p.env])) return;
  const nu = Date.now();
  if (nu - laatste < 6 * 60 * 60 * 1000) return;
  laatste = nu;
  syncAlleTradeTracker().catch(() => {});
}
