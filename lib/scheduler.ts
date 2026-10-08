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

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STAMP_FILE = path.join(DATA_DIR, "last-onderhoud.txt");
const BLOG_STAMP = path.join(DATA_DIR, "last-blog.txt");
const FEED_STAMP = path.join(DATA_DIR, "last-feeds.txt");
const KOLIBRI_STAMP = path.join(DATA_DIR, "last-kolibri.txt");
const SOCIAL_AUTO_STAMP = path.join(DATA_DIR, "last-social-auto.txt");
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
// uitgeschreven URL. Zet elke dag hooguit één live woning in de wachtrij; de
// bestaande draaiSocial() plaatst 'm daarna via Metricool, en omdat we 'm als
// SocialPost vastleggen verschijnt de woning ook op /insta (de link-in-bio).
//
// Alleen actief als SOCIAL_AUTO=1 én Metricool/Instagram gekoppeld is. Zo kunnen
// we veilig uitrollen (vlag uit = geen gedragswijziging) en pas omschakelen als
// de oude RSS-automaat in Metricool is uitgezet (anders zou je dubbel posten).
let bezigOrganisch = false;
async function draaiOrganischSocial(nu: Date): Promise<void> {
  if (process.env.SOCIAL_AUTO !== "1") return;
  if (bezigOrganisch || (!metricoolEnabled() && !instagramEnabled())) return;
  bezigOrganisch = true;
  try {
    // Hooguit één automatische post per kalenderdag.
    try {
      if (fs.existsSync(SOCIAL_AUTO_STAMP) && fs.readFileSync(SOCIAL_AUTO_STAMP, "utf8").trim() === vandaag(nu)) return;
    } catch { /* ga door */ }

    const posts = getSocialPosts();
    // Niet opstapelen: staat er al een automatische post klaar of ingepland,
    // dan eerst die laten plaatsen.
    if (posts.some((p) => p.bron === "automatisch" && (p.status === "wachtrij" || p.status === "ingepland"))) return;

    const live = getListings().filter((l) => l.status === "live" && (l.fotos?.length || 0) > 0);
    if (live.length === 0) return;

    // Wanneer is elke woning voor het laatst gepost? Zo rouleren we netjes.
    const laatst = new Map<string, string>();
    for (const p of posts) {
      const cur = laatst.get(p.listingId);
      if (!cur || p.aangemaakt > cur) laatst.set(p.listingId, p.aangemaakt);
    }
    const nooit = live.filter((l) => !laatst.has(l.id));
    const kandidaat = nooit.length
      ? nooit.slice().sort((a, b) =>
          (b.uitgelicht ? 1 : 0) - (a.uitgelicht ? 1 : 0) ||
          String(b.aangemaakt).localeCompare(String(a.aangemaakt)))[0]
      : live.slice().sort((a, b) =>
          String(laatst.get(a.id) || "").localeCompare(String(laatst.get(b.id) || "")))[0];
    if (!kandidaat) return;

    const caption = await genereerSocialCaption(kandidaat).catch(() => undefined);
    addSocialPost({
      listingId: kandidaat.id,
      kanaal: "instagram",
      prioriteit: false,
      status: "wachtrij",
      bron: "automatisch",
      tekst: caption || kandidaat.titel,
      fotoUrl: kandidaat.fotos?.[0],
    });

    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(SOCIAL_AUTO_STAMP, vandaag(nu), "utf8");
    } catch { /* niet fataal */ }
  } finally {
    bezigOrganisch = false;
  }
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
  void draaiOrganischSocial(new Date()).catch(() => {});
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
