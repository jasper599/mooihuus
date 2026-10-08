// Interne dagelijkse scheduler — draait binnen het Node-proces van de server.
//
// Doet één keer per kalenderdag (UTC): de database-back-up en de verloop-/
// verlengcheck. Een datumstempel op het volume voorkomt dubbel draaien, ook
// over herstarts/deploys heen. Nooit fataal: fouten worden opgevangen zodat de
// server blijft draaien.

import fs from "fs";
import path from "path";
import { maakBackup } from "./backup";
import { verwerkVerlopendeAdvertenties } from "./verlenging";
import { metricoolEnabled, scheduleInstagramPost, volgendeSlot } from "./metricool";
import { instagramEnabled, postToInstagram } from "./instagram";
import { getBlogPosts } from "./blog";
import { addBlogPost, addSocialPost, getSocialPosts, updateSocialPost, getListing, getListings, updateListing } from "./db";
import { genereerBlogpost } from "./blog-generator";
import { genereerSocialCaption } from "./social-caption";
import { syncMarinaparken } from "./marinaparken-feed";
import { syncAlleTradeTracker } from "./tradetracker-feed";
import { syncKolibri } from "./feed-import";
import { kolibriGeconfigureerd } from "./kolibri";
import { HUUSMEESTERS_CATEGORIEEN, huusmeesterSlug } from "./partners";
import { COMPANY } from "./company";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STAMP_FILE = path.join(DATA_DIR, "last-onderhoud.txt");
const BLOG_STAMP = path.join(DATA_DIR, "last-blog.txt");
const FEED_STAMP = path.join(DATA_DIR, "last-feeds.txt");
const KOLIBRI_STAMP = path.join(DATA_DIR, "last-kolibri.txt");
const SOCIAL_ROT_STAMP = path.join(DATA_DIR, "social-rotatie.txt");
const GEPLAND_TOT_STAMP = path.join(DATA_DIR, "social-gepland-tot.txt");
const WEKEN_VOORUIT = 3; // contentkalender zoveel weken vooruit gevuld houden
const INTERVAL = 30 * 60 * 1000; // elke 30 minuten kijken of het al gedraaid is
const WEEK = 7 * 24 * 60 * 60 * 1000;
const FEED_INTERVAL = 6 * 60 * 60 * 1000; // huurfeeds elke 6 uur verversen
const KOLIBRI_INTERVAL = 60 * 60 * 1000; // Kolibri elk uur synchroniseren

function vandaag(d = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function alGedraaidVandaag(): boolean {
  try {
    return fs.existsSync(STAMP_FILE) && fs.readFileSync(STAMP_FILE, "utf8").trim() === vandaag();
  } catch {
    return false;
  }
}

function markeer(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STAMP_FILE, vandaag(), "utf8");
  } catch {
    /* niet fataal */
  }
}

// Wekelijkse blog: genereert één nieuw artikel als er ≥7 dagen zijn verstreken
// sinds de laatste (of als er nog nooit een gegenereerd is).
function blogNodig(nu: Date): boolean {
  try {
    if (!fs.existsSync(BLOG_STAMP)) return true;
    const laatst = new Date(fs.readFileSync(BLOG_STAMP, "utf8").trim()).getTime();
    return nu.getTime() - laatst >= WEEK;
  } catch {
    return true;
  }
}
let bezigBlog = false;
async function draaiBlog(nu: Date): Promise<void> {
  if (bezigBlog || !blogNodig(nu)) return;
  bezigBlog = true;
  try {
    await genereerEnBewaarBlog(nu);
  } finally {
    bezigBlog = false;
  }
}
async function genereerEnBewaarBlog(nu: Date): Promise<void> {
  const bestaand = getBlogPosts();
  const titels = bestaand.map((p) => p.titel).slice(0, 40);
  const post = await genereerBlogpost(titels, bestaand.length, nu);
  if (post) {
    addBlogPost(post);
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(BLOG_STAMP, nu.toISOString(), "utf8");
    } catch {
      /* niet fataal */
    }
  }
}

// Huurfeeds (Marinaparken + TradeTracker/Glampings/TopParken) op de achtergrond
// verversen — bewust NIET op een bezoekerspagina, zodat een grote of trage feed
// nooit meer een verzoek of de healthcheck kan blokkeren.
function feedsNodig(nu: Date): boolean {
  try {
    if (!fs.existsSync(FEED_STAMP)) return true;
    const laatst = new Date(fs.readFileSync(FEED_STAMP, "utf8").trim()).getTime();
    return nu.getTime() - laatst >= FEED_INTERVAL;
  } catch {
    return true;
  }
}
let bezigFeeds = false;
async function draaiFeeds(nu: Date): Promise<void> {
  if (bezigFeeds || !feedsNodig(nu)) return;
  bezigFeeds = true;
  try {
    await syncMarinaparken().catch(() => {});
    await syncAlleTradeTracker().catch(() => {});
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(FEED_STAMP, nu.toISOString(), "utf8");
    } catch {
      /* niet fataal */
    }
  } finally {
    bezigFeeds = false;
  }
}

function kolibriNodig(nu: Date): boolean {
  try {
    if (!fs.existsSync(KOLIBRI_STAMP)) return true;
    const laatst = new Date(fs.readFileSync(KOLIBRI_STAMP, "utf8").trim()).getTime();
    return nu.getTime() - laatst >= KOLIBRI_INTERVAL;
  } catch {
    return true;
  }
}
let bezigKolibri = false;
async function draaiKolibri(nu: Date): Promise<void> {
  if (bezigKolibri || !kolibriGeconfigureerd() || !kolibriNodig(nu)) return;
  bezigKolibri = true;
  try {
    await syncKolibri().catch(() => {});
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(KOLIBRI_STAMP, nu.toISOString(), "utf8");
    } catch {
      /* niet fataal */
    }
  } finally {
    bezigKolibri = false;
  }
}

let bezigSocial = false;
async function draaiSocial(): Promise<void> {
  if (bezigSocial || (!instagramEnabled() && !metricoolEnabled())) return;
  bezigSocial = true;
  try {
    const wacht = getSocialPosts().filter((x) => x.status === "wachtrij");
    for (const post of wacht) {
      const listing = getListing(post.listingId);
      const caption = post.tekst || listing?.titel || "Mooihuus";
      const fotoUrl = post.fotoUrl || listing?.fotos?.[0];
      if (instagramEnabled()) {
        const r = await postToInstagram({ imageUrl: fotoUrl, caption }).catch(() => ({ ok: false, error: "verbindingsfout" } as const));
        if ((r as any).ok) {
          updateSocialPost(post.id, { status: "geplaatst", geplaatstOp: new Date().toISOString(), metricoolId: (r as any).id, notitie: undefined });
        } else {
          updateSocialPost(post.id, { notitie: `Instagram: ${(r as any).error || "plaatsen mislukt"}` });
        }
      } else {
        const publishAt = volgendeSlot(post.prioriteit, new Date());
        const r = await scheduleInstagramPost({ tekst: caption, fotoUrl, publishAt }).catch(() => ({ ok: false, error: "verbindingsfout" } as const));
        if ((r as any).ok) {
          updateSocialPost(post.id, { status: "ingepland", metricoolId: (r as any).id, ingeplandVoor: publishAt, notitie: undefined });
        } else {
          updateSocialPost(post.id, { notitie: `Metricool: ${(r as any).error || "inplannen mislukt"}` });
        }
      }
    }
  } finally {
    bezigSocial = false;
  }
}

// Automatische (organische) Instagram-posts — vanuit ONZE app, zodat wij de
// caption 100% bepalen: altijd nette tekst met "link in bio", NOOIT een
// uitgeschreven URL. Drie keer per week (ma/wo/vr, overdag), met een MIX die
// rouleert: woning → blog-tip → Huusmeesters-categorie → woning → … Een woning
// leggen we ook als SocialPost vast, zodat die op /insta (de link-in-bio) komt.
//
// Alleen actief als SOCIAL_AUTO=1 én Metricool/Instagram gekoppeld is. Zo kunnen
// we veilig uitrollen (vlag uit = geen gedragswijziging) en pas omschakelen als
// de oude RSS-automaat in Metricool uit staat (anders zou je dubbel posten).
const SITE = COMPANY.website;
const POST_DAGEN = new Set(["Mon", "Wed", "Fri"]); // 3× per week
const SOORTEN = ["woning", "blog", "huusmeester"] as const;

function amsWeekdag(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", weekday: "short" }).format(d);
}
function amsDatum(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d); // YYYY-MM-DD
}
function socialTag(s: string): string {
  return "#" + (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function leesTeller(): number {
  try { return parseInt(fs.readFileSync(SOCIAL_ROT_STAMP, "utf8").trim(), 10) || 0; } catch { return 0; }
}
function schrijfTeller(n: number): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SOCIAL_ROT_STAMP, String(n), "utf8");
  } catch { /* niet fataal */ }
}

function blogCaptionSchoon(p: any): string {
  const intro = (p.intro || "").replace(/\s+/g, " ").trim().slice(0, 200);
  return [
    `${p.emoji || "📝"} ${p.titel}`, ``, intro, ``,
    `👉 Lees het hele artikel via de link in onze bio.`, ``,
    `#recreatiewoning #vakantiehuis #tips #mooihuus ${socialTag(p.categorie || "")}`.trim(),
  ].join("\n");
}
function huusCaptionSchoon(c: any): string {
  return [
    `🛠️ ${c.titel} voor je recreatiewoning?`, ``,
    (c.tekst || "").replace(/\s+/g, " ").trim(), ``,
    `De Huusmeesters van Mooihuus regelen het voor je — kijk via de link in onze bio.`, ``,
    `#huusmeesters #recreatiewoning #vakantiehuis #mooihuus`,
  ].join("\n");
}

// Kiest de volgende te posten woning (nog nooit gepost eerst, anders langst
// geleden gepost; uitgelichte/nieuwe krijgen voorrang).
function kiesWoning(): any {
  const posts = getSocialPosts();
  const live = getListings().filter((l) => l.status === "live" && (l.fotos?.length || 0) > 0);
  if (live.length === 0) return undefined;
  const laatst = new Map<string, string>();
  for (const p of posts) {
    const cur = laatst.get(p.listingId);
    if (!cur || p.aangemaakt > cur) laatst.set(p.listingId, p.aangemaakt);
  }
  const nooit = live.filter((l) => !laatst.has(l.id));
  return nooit.length
    ? nooit.slice().sort((a, b) =>
        (b.uitgelicht ? 1 : 0) - (a.uitgelicht ? 1 : 0) ||
        String(b.aangemaakt).localeCompare(String(a.aangemaakt)))[0]
    : live.slice().sort((a, b) =>
        String(laatst.get(a.id) || "").localeCompare(String(laatst.get(b.id) || "")))[0];
}

// Plaatst één post van de soort die bij deze rotatiestand hoort. Valt bij een
// lege soort (geen blogs/categorieën) netjes terug op een woning.
async function plaatsEenPost(teller: number, publishAt: string): Promise<{ soort: string; ok: boolean; detail: string }> {
  const soort = SOORTEN[teller % SOORTEN.length];

  if (soort === "blog") {
    const blogs = getBlogPosts();
    if (blogs.length > 0) {
      const p: any = blogs[Math.floor(teller / SOORTEN.length) % blogs.length];
      const r: any = await scheduleInstagramPost({ tekst: blogCaptionSchoon(p), fotoUrl: `${SITE}/social/blog/${p.slug}`, publishAt }).catch(() => ({ ok: false, error: "verbindingsfout" }));
      return { soort, ok: !!r.ok, detail: r.ok ? `blog: ${p.titel}` : `blog mislukt: ${r.error}` };
    }
  } else if (soort === "huusmeester") {
    const cats = HUUSMEESTERS_CATEGORIEEN;
    if (cats.length > 0) {
      const c: any = cats[Math.floor(teller / SOORTEN.length) % cats.length];
      const r: any = await scheduleInstagramPost({ tekst: huusCaptionSchoon(c), fotoUrl: `${SITE}/social/huusmeester/${huusmeesterSlug(c.titel)}`, publishAt }).catch(() => ({ ok: false, error: "verbindingsfout" }));
      return { soort, ok: !!r.ok, detail: r.ok ? `huusmeester: ${c.titel}` : `huusmeester mislukt: ${r.error}` };
    }
  }

  // Woning (ook de terugval voor een lege blog/huusmeester-soort).
  const w = kiesWoning();
  if (!w) return { soort: "woning", ok: false, detail: "geen geschikte woning" };
  const caption = (await genereerSocialCaption(w).catch(() => undefined)) || w.titel;
  const r: any = await scheduleInstagramPost({ tekst: caption, fotoUrl: w.fotos?.[0], publishAt }).catch(() => ({ ok: false, error: "verbindingsfout" }));
  // Woning vastleggen voor /insta. 'ingepland' zodat draaiSocial 'm niet nog eens plaatst.
  addSocialPost({
    listingId: w.id, kanaal: "instagram", prioriteit: false,
    status: r.ok ? "ingepland" : "wachtrij", bron: "automatisch",
    tekst: caption, fotoUrl: w.fotos?.[0],
    metricoolId: r.ok ? r.id : undefined,
    ingeplandVoor: r.ok ? publishAt : undefined,
    notitie: r.ok ? undefined : `Metricool: ${r.error || "inplannen mislukt"}`,
  });
  return { soort: "woning", ok: !!r.ok, detail: r.ok ? `woning: ${w.titel}` : `woning mislukt: ${r.error}` };
}

// Hoeveel Amsterdam-minuten loopt de klok vóór op UTC op moment d (zomer/winter).
function amsOffsetMin(d: Date): number {
  const p: any = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(d).reduce((a: any, x) => { a[x.type] = x.value; return a; }, {});
  const asWall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asWall - d.getTime()) / 60000);
}

// Alle ma/wo/vr 09:15 (Amsterdam) momenten die ná 'vanaf' en t/m 'tot' vallen.
function komendeSlots(vanaf: Date, tot: Date): Date[] {
  const slots: Date[] = [];
  const gezien = new Set<string>();
  for (let i = 0; i < 40; i++) {
    // Anker op 12:00 UTC per dag — ver van middernacht, dus DST-veilig.
    const anker = new Date(Date.UTC(vanaf.getUTCFullYear(), vanaf.getUTCMonth(), vanaf.getUTCDate(), 12, 0, 0) + i * 86400000);
    const ymd = amsDatum(anker);
    if (gezien.has(ymd)) continue;
    gezien.add(ymd);
    if (!POST_DAGEN.has(amsWeekdag(anker))) continue;
    const [Y, M, D] = ymd.split("-").map(Number);
    const gok = Date.UTC(Y, M - 1, D, 9, 15, 0);
    const slot = new Date(gok - amsOffsetMin(new Date(gok)) * 60000); // 09:15 Amsterdam → UTC-instant
    if (slot.getTime() > vanaf.getTime() && slot.getTime() <= tot.getTime()) slots.push(slot);
  }
  return slots;
}

// Houdt de contentkalender ~3 weken vooruit gevuld: plant op elk nog-leeg
// ma/wo/vr-slot één post in (rouleren woning/blog/huusmeester). Zo staat alles
// ruim van tevoren in Metricool én in je beheer, en kun je het nog aanpassen.
let bezigOrganisch = false;
async function vulAgenda(nu: Date): Promise<void> {
  if (process.env.SOCIAL_AUTO !== "1") return;
  if (bezigOrganisch || (!metricoolEnabled() && !instagramEnabled())) return;
  bezigOrganisch = true;
  try {
    let geplandTot = 0;
    try { geplandTot = Number(fs.readFileSync(GEPLAND_TOT_STAMP, "utf8").trim()) || 0; } catch { /* leeg */ }
    const vanaf = new Date(Math.max(nu.getTime(), geplandTot));
    const tot = new Date(nu.getTime() + WEKEN_VOORUIT * 7 * 86400000);
    const slots = komendeSlots(vanaf, tot);
    let teller = leesTeller();
    for (const slot of slots) {
      const res = await plaatsEenPost(teller, slot.toISOString());
      if (!res.ok) break; // stop bij een fout; volgende tick pakt het weer op
      teller += 1;
      schrijfTeller(teller);
      try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(GEPLAND_TOT_STAMP, String(slot.getTime()), "utf8");
      } catch { /* niet fataal */ }
    }
  } finally {
    bezigOrganisch = false;
  }
}

// Handmatig/testen: forceer nu direct één post (~15 min vooruit).
export async function forceerOrganischePost(): Promise<{ soort: string; ok: boolean; detail: string }> {
  if (!metricoolEnabled() && !instagramEnabled()) return { soort: "-", ok: false, detail: "Geen Instagram/Metricool-koppeling" };
  const teller = leesTeller();
  const res = await plaatsEenPost(teller, volgendeSlot(true, new Date()));
  if (res.ok) schrijfTeller(teller + 1);
  return res;
}

// Zet een betaalde "Blikvanger" (uitgelicht met einddatum) automatisch weer uit
// zodra de week voorbij is. Permanente uitlichting (bijv. Luyten, zonder
// uitgelichtTot) blijft ongemoeid. Nooit fataal.
function draaiUitgelicht(): void {
  const nu = Date.now();
  for (const l of getListings()) {
    if (l.uitgelicht && l.uitgelichtTot && new Date(l.uitgelichtTot).getTime() <= nu) {
      updateListing(l.id, { uitgelicht: false, uitgelichtTot: undefined });
    }
  }
}

let bezig = false;
async function draaiDagelijks(): Promise<void> {
  if (bezig || alGedraaidVandaag()) return;
  bezig = true;
  try {
    await maakBackup().catch(() => {});
    await verwerkVerlopendeAdvertenties().catch(() => {});
    try { draaiUitgelicht(); } catch { /* niet fataal */ }
    markeer(); // pas markeren als alles klaar is (crasht het eerder, dan retry volgende tick)
  } finally {
    bezig = false;
  }
}

// Eén tick: dagelijks onderhoud (back-up + verloop, 1×/dag) en de wekelijkse
// blog (1×/week), elk met een eigen ritme.
function tick(): void {
  void draaiDagelijks();
  void draaiBlog(new Date()).catch(() => {});
  void draaiFeeds(new Date()).catch(() => {});
  void draaiKolibri(new Date()).catch(() => {});
  void vulAgenda(new Date()).catch(() => {});
  void draaiSocial().catch(() => {});
}

let gestart = false;
export function startScheduler(): void {
  if (gestart) return;
  gestart = true;
  // Korte vertraging na opstart, dan periodiek. De eerste blog wordt dus vlak
  // na deploy gegenereerd als er die week nog geen is.
  setTimeout(tick, 20000);
  setInterval(tick, INTERVAL);
}
