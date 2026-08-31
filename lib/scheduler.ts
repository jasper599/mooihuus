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
import { getBlogPosts } from "./blog";
import { addBlogPost } from "./db";
import { genereerBlogpost } from "./blog-generator";
import { syncMarinaparken } from "./marinaparken-feed";
import { syncAlleTradeTracker } from "./tradetracker-feed";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STAMP_FILE = path.join(DATA_DIR, "last-onderhoud.txt");
const BLOG_STAMP = path.join(DATA_DIR, "last-blog.txt");
const FEED_STAMP = path.join(DATA_DIR, "last-feeds.txt");
const INTERVAL = 30 * 60 * 1000; // elke 30 minuten kijken of het al gedraaid is
const WEEK = 7 * 24 * 60 * 60 * 1000;
const FEED_INTERVAL = 6 * 60 * 60 * 1000; // huurfeeds elke 6 uur verversen

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

let bezig = false;
async function draaiDagelijks(): Promise<void> {
  if (bezig || alGedraaidVandaag()) return;
  bezig = true;
  try {
    await maakBackup().catch(() => {});
    await verwerkVerlopendeAdvertenties().catch(() => {});
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
