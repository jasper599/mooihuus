
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Listing, Lead, Payment, EmailRecord, Enquete, Huusmeester, Zoekopdracht, Review, PartnerKlik, Pageview, PostcodeGeo, NieuwsbriefLid, SocialPost } from "./types";
import { LM_OWNER, LM_LISTINGS } from "./lm-listings";
import type { BlogPost } from "./blog";
 
// ------------------------------------------------------------------
// Persistente datalaag voor de MVP — schrijft naar ./data/db.json.
// Zonder externe database, dus dit draait overal out-of-the-box.
// Vervang later door Postgres + Prisma (zelfde functies eromheen).
// ------------------------------------------------------------------
 
interface DB {
  users: User[];
  listings: Listing[];
  leads: Lead[];
  payments: Payment[];
  emails: EmailRecord[];
  enquetes: Enquete[];
  huusmeesters: Huusmeester[];
  zoekopdrachten: Zoekopdracht[];
  reviews: Review[];
  partnerkliks: PartnerKlik[];
  pageviews: Pageview[];
  postcodegeo: PostcodeGeo[];
  nieuwsbrief: NieuwsbriefLid[];
  socialPosts: SocialPost[];
  blogPosts: BlogPost[];
  laatsteNieuwsbriefSlug?: string;
  laatsteMaandrapportMaand?: string; // "yyyy-mm" van de laatst verstuurde ronde
  resetTokens?: { token: string; userId: string; expires: number }[];
  aiStyling?: { datum: string; totaal: number; perUser: Record<string, number> };
  seq: number;
}
 
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
 
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
 
function seed(): DB {
  const now = new Date().toISOString();
  const beheerder: User = {
    id: "u-admin",
    naam: "Mooihuus Beheer",
    email: "beheer@mooihuus.nl",
    wachtwoordHash: bcrypt.hashSync("beheer123", 10),
    rol: "beheerder",
    type: "zakelijk",
    bedrijfsnaam: "Huus B.V.",
    aangemaakt: now,
  };
  // Schone start: alleen het beheeraccount. Het echte aanbod (Luyten) wordt
  // door ensureLmData toegevoegd; alle demo-data is verwijderd.
  return { users: [beheerder], listings: [], leads: [], payments: [], emails: [], enquetes: [], huusmeesters: [], zoekopdrachten: [], reviews: [], partnerkliks: [], pageviews: [], postcodegeo: [], nieuwsbrief: [], socialPosts: [], blogPosts: [], seq: 100 };
}
 
// Verwijdert de oude demo-woningen, demo-accounts en demo-leads uit een
// bestaande database (bijv. de Railway-Volume). Idempotent — draait op id.
const DEMO_LISTING_IDS = ["1", "2", "3", "4", "5", "6"];
const DEMO_USER_IDS = ["u-anouk", "u-org"];
const DEMO_LEAD_IDS = ["l1", "l2"];
const DEMO_ENQUETE_IDS = ["enq-1"];
const DEMO_HM_IDS = ["hm-1", "hm-2", "hm-3", "hm-4"];
 
function removeDemoData(db: DB): boolean {
  let changed = false;
  const cut = <T>(arr: T[], keep: (x: T) => boolean): T[] => {
    const next = arr.filter(keep);
    if (next.length !== arr.length) changed = true;
    return next;
  };
  db.listings = cut(db.listings, (l) => !DEMO_LISTING_IDS.includes(l.id));
  db.users = cut(db.users, (u) => !DEMO_USER_IDS.includes(u.id));
  db.leads = cut(db.leads, (l) => !DEMO_LEAD_IDS.includes(l.id) && !DEMO_LISTING_IDS.includes(l.listingId));
  db.enquetes = cut(db.enquetes, (e) => !DEMO_ENQUETE_IDS.includes(e.id));
  db.huusmeesters = cut(db.huusmeesters, (h) => !DEMO_HM_IDS.includes(h.id));
  return changed;
}
 
let cache: DB | null = null;
 
// Zorgt dat het Luyten-account en het Luyten-aanbod aanwezig zijn.
// Idempotent (op id), dus veilig op zowel een verse als bestaande database.
function ensureLmData(db: DB): boolean {
  let changed = false;
  if (!db.users.some((u) => u.id === LM_OWNER.id)) {
    db.users.push({
      id: LM_OWNER.id,
      naam: LM_OWNER.naam,
      email: LM_OWNER.email,
      wachtwoordHash: bcrypt.hashSync(LM_OWNER.wachtwoord, 10),
      rol: "eigenaar",
      type: "zakelijk",
      bedrijfsnaam: LM_OWNER.bedrijfsnaam,
      kvk: LM_OWNER.kvk,
      aangemaakt: new Date().toISOString(),
    });
    changed = true;
  }
  // Verwijder oude geïmporteerde woningen die niet meer in de set staan
  // (bijv. verkocht/verwijderd bij Luyten). Alleen lm-* (import) — door
  // gebruikers zelf aangemaakte woningen (li-*) blijven altijd behouden.
  const validIds = new Set(LM_LISTINGS.map((l) => l.id));
  const voor = db.listings.length;
  db.listings = db.listings.filter((l) => !(l.id.startsWith("lm-") && !validIds.has(l.id)));
  if (db.listings.length !== voor) changed = true;
 
  for (const l of LM_LISTINGS) {
    const bestaand = db.listings.find((x) => x.id === l.id);
    if (!bestaand) {
      db.listings.push({ ...l, ownerId: LM_OWNER.id, source: "luyten", aangemaakt: new Date().toISOString() });
      changed = true;
    } else {
      // Bestaande Luyten-woning bijwerken met de nieuwste gegevens uit de bron
      // (video's, foto's, kenmerken) — maar door de beheerder ingestelde velden
      // (status, uitgelicht) en de aanmaakdatum behouden.
      const before = JSON.stringify(bestaand);
      Object.assign(bestaand, l, {
        ownerId: LM_OWNER.id,
        source: "luyten",
        aangemaakt: bestaand.aangemaakt,
        status: bestaand.status,
        uitgelicht: bestaand.uitgelicht,
      });
      if (JSON.stringify(bestaand) !== before) changed = true;
    }
  }
  return changed;
}
 
function load(): DB {
  if (cache) return cache;
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
    } catch {
      cache = null; // val terug op seed
    }
  }
  const fresh = !cache;
  if (!cache) cache = seed();
  // Migratie: zorg dat nieuwere velden bestaan in oudere db.json bestanden.
  let migrated = false;
  if (!Array.isArray(cache.reviews)) { cache.reviews = []; migrated = true; }
  if (!Array.isArray(cache.partnerkliks)) { cache.partnerkliks = []; migrated = true; }
  if (!Array.isArray(cache.pageviews)) { cache.pageviews = []; migrated = true; }
  if (!Array.isArray(cache.postcodegeo)) { cache.postcodegeo = []; migrated = true; }
  // Backfill: bestaande woningen een bron geven (lm-* = luyten, rest = eigen).
  for (const l of cache.listings) {
    if (!l.source) { l.source = l.id.startsWith("lm-") ? "luyten" : "eigen"; migrated = true; }
  }
  if (!Array.isArray(cache.nieuwsbrief)) { cache.nieuwsbrief = []; migrated = true; }
  if (!Array.isArray(cache.socialPosts)) { cache.socialPosts = []; migrated = true; }
  if (!Array.isArray(cache.blogPosts)) { cache.blogPosts = []; migrated = true; }
  const removed = removeDemoData(cache);
  const added = ensureLmData(cache);
  if (fresh || removed || added || migrated) save();
  return cache;
}
 
function save() {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2), "utf8");
}
 
function nextId(prefix: string): string {
  const db = load();
  db.seq += 1;
  return `${prefix}${db.seq}`;
}
 
// ---------- Users ----------
export function getUsers(): User[] {
  return load().users;
}
export function getUserByEmail(email: string): User | undefined {
  return load().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
export function getUser(id: string): User | undefined {
  return load().users.find((u) => u.id === id);
}
export function addUser(data: {
  naam: string;
  email: string;
  wachtwoord: string;
  type?: "particulier" | "zakelijk";
  bedrijfsnaam?: string;
  kvk?: string;
  btw?: string;
  telefoon?: string;
  adres?: string;
  postcode?: string;
  plaats?: string;
  iban?: string;
  factuurEmail?: string;
  website?: string;
}): User {
  const db = load();
  const type = data.type === "zakelijk" ? "zakelijk" : "particulier";
  const zak = type === "zakelijk";
  const user: User = {
    id: nextId("u-"),
    naam: data.naam,
    email: data.email,
    wachtwoordHash: bcrypt.hashSync(data.wachtwoord, 10),
    rol: "eigenaar",
    type,
    bedrijfsnaam: zak ? data.bedrijfsnaam : undefined,
    kvk: zak ? data.kvk : undefined,
    btw: zak ? data.btw : undefined,
    telefoon: zak ? data.telefoon : undefined,
    adres: zak ? data.adres : undefined,
    postcode: zak ? data.postcode : undefined,
    plaats: zak ? data.plaats : undefined,
    iban: zak ? data.iban : undefined,
    factuurEmail: zak ? data.factuurEmail : undefined,
    website: zak ? data.website : undefined,
    aangemaakt: new Date().toISOString(),
  };
  db.users.push(user);
  save();
  return user;
}
 
export function updateUser(id: string, patch: Partial<User>): User | undefined {
  const db = load();
  const u = db.users.find((x) => x.id === id);
  if (!u) return undefined;
  Object.assign(u, patch);
  save();
  return u;
}
export function setWachtwoord(id: string, nieuwWachtwoord: string): boolean {
  const u = updateUser(id, { wachtwoordHash: bcrypt.hashSync(nieuwWachtwoord, 10) });
  return !!u;
}
export function checkWachtwoord(id: string, wachtwoord: string): boolean {
  const u = getUser(id);
  return !!u && bcrypt.compareSync(wachtwoord, u.wachtwoordHash);
}
 
// ---------- Wachtwoord-reset tokens ----------
function genToken(): string {
  return Array.from({ length: 40 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
}
export function maakResetToken(userId: string): string {
  const db = load();
  if (!db.resetTokens) db.resetTokens = [];
  const token = genToken();
  // oude tokens van deze gebruiker opruimen
  db.resetTokens = db.resetTokens.filter((t) => t.userId !== userId && t.expires > Date.now());
  db.resetTokens.push({ token, userId, expires: Date.now() + 60 * 60 * 1000 });
  save();
  return token;
}
export function gebruikResetToken(token: string): User | undefined {
  const db = load();
  if (!db.resetTokens) db.resetTokens = [];
  const rec = db.resetTokens.find((t) => t.token === token && t.expires > Date.now());
  if (!rec) return undefined;
  db.resetTokens = db.resetTokens.filter((t) => t.token !== token);
  save();
  return db.users.find((u) => u.id === rec.userId);
}
 
// ---------- Listings ----------
export function getListings(opts?: { status?: string }): Listing[] {
  const all = load().listings;
  return opts?.status ? all.filter((l) => l.status === opts.status) : all;
}
export function getLiveListings(): Listing[] {
  return load()
    .listings.filter((l) => l.status === "live")
    .sort((a, b) => {
      const au = a.uitgelicht ? 1 : 0;
      const bu = b.uitgelicht ? 1 : 0;
      if (bu !== au) return bu - au;
      const ap = a.promotedAt || a.aangemaakt;
      const bp = b.promotedAt || b.aangemaakt;
      return bp.localeCompare(ap);
    });
}
export function getListing(id: string): Listing | undefined {
  return load().listings.find((l) => l.id === id);
}
export function getListingsByOwner(ownerId: string): Listing[] {
  return load().listings.filter((l) => l.ownerId === ownerId);
}
export function addListing(data: Omit<Listing, "id" | "aangemaakt">): Listing {
  const db = load();
  const listing: Listing = { source: "eigen", ...data, id: nextId("li-"), aangemaakt: new Date().toISOString() };
  db.listings.unshift(listing);
  save();
  return listing;
}
export function updateListing(id: string, patch: Partial<Listing>): Listing | undefined {
  const db = load();
  const l = db.listings.find((x) => x.id === id);
  if (!l) return undefined;
  Object.assign(l, patch);
  save();
  return l;
}
// ---------- Feed-synchronisatie (Kolibri / Realworks / andere bronnen) ----------
// Woningen staan al in de database; deze functies laten een externe feed
// woningen toevoegen, bijwerken en (als ze bij de bron verdwijnen) offline zetten.
export function getFeedListings(source: string): Listing[] {
  return load().listings.filter((l) => l.source === source);
}
 
// opslaan=false: alleen de in-memory cache bijwerken en NIET naar schijf
// schrijven. Bij grote feeds (bv. 1710 woningen) zou per-woning wegschrijven de
// server blokkeren; de aanroeper schrijft dan één keer weg via bewaarFeeds().
export function upsertFeedListing(source: string, externalId: string, data: Partial<Listing>, opslaan = true): Listing {
  const db = load();
  const bestaand = db.listings.find((l) => l.source === source && l.externalId === externalId);
  if (bestaand) {
    Object.assign(bestaand, data, { source, externalId });
    if (opslaan) save();
    return bestaand;
  }
  const id = `${source}-${externalId}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 90);
  const listing: Listing = {
    id,
    source,
    externalId,
    ownerId: data.ownerId || LM_OWNER.id,
    titel: data.titel || "Recreatiewoning",
    type: data.type || "Recreatiewoning",
    doel: (data.doel as any) || "koop",
    provincie: data.provincie || "Nederland",
    park: data.park || "",
    personen: data.personen ?? 2,
    m2: data.m2 ?? 50,
    prijs: data.prijs ?? 0,
    omschrijving: data.omschrijving || "",
    kleur: data.kleur ?? db.listings.length % 6,
    pakket: (data.pakket as any) || "Basis",
    status: (data.status as any) || "live",
    aangemaakt: new Date().toISOString(),
  };
  // optionele velden overnemen (fotos, videoUrl, kenmerken, prijsSuffix, grond, ...)
  Object.assign(listing, data, { id, source, externalId, ownerId: listing.ownerId, aangemaakt: listing.aangemaakt });
  db.listings.push(listing);
  if (opslaan) save();
  return listing;
}

// Schrijf de huidige cache één keer naar schijf. Gebruik dit ná een batch
// upsertFeedListing(..., false)/sweepFeed(..., false)-aanroepen.
export function bewaarFeeds(): void {
  save();
}

// Zet woningen van deze bron die niet meer in de feed voorkomen op offline.
export function sweepFeed(source: string, seenExternalIds: string[], opslaan = true): number {
  const db = load();
  const seen = new Set(seenExternalIds);
  let n = 0;
  for (const l of db.listings) {
    if (l.source === source && l.externalId && !seen.has(l.externalId) && l.status === "live") {
      l.status = "offline";
      n++;
    }
  }
  if (n && opslaan) save();
  return n;
}

// Ontdubbelt externe (affiliate/feed) woningen: staat hetzelfde object in twee
// feeds, dan blijft er één zichtbaar. Verbergt UITSLUITEND externe woningen
// (die met een externalUrl) — eigen/Luyten-aanbod wordt nooit aangeraakt.
export function dedupliceerExterneWoningen(): number {
  const db = load();
  const prio = (bron?: string) =>
    bron === "eigen" ? 100 : bron === "luyten" ? 90 :
    bron === "belvilla" ? 40 : bron === "marinaparken" ? 38 :
    bron === "glampings" ? 36 : bron === "topparken" ? 34 : bron === "europarcs" ? 32 : 10;
  const norm = (s: string) => (s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
  const sleutel = (l: Listing) => `${norm(l.provincie)}|${norm(l.titel)}|${l.personen || ""}`;

  const groepen = new Map<string, Listing[]>();
  for (const l of db.listings) {
    if (l.status !== "live") continue;
    const k = sleutel(l);
    const g = groepen.get(k) || [];
    g.push(l);
    groepen.set(k, g);
  }

  let verborgen = 0;
  for (const groep of Array.from(groepen.values())) {
    if (groep.length < 2) continue;
    // Hoogste prioriteit wint (eigen/Luyten boven feeds).
    groep.sort((a: Listing, b: Listing) => prio(b.source) - prio(a.source));
    for (let i = 1; i < groep.length; i++) {
      // Verberg alleen externe duplicaten; nooit een interne (eigen) woning.
      if (groep[i].externalUrl && groep[i].status === "live") {
        groep[i].status = "offline";
        verborgen++;
      }
    }
  }
  if (verborgen) save();
  return verborgen;
}
 
export function deleteListing(id: string): boolean {
  const db = load();
  const i = db.listings.findIndex((x) => x.id === id);
  if (i === -1) return false;
  db.listings.splice(i, 1);
  save();
  return true;
}
 
// ---------- Leads ----------
export function getLeads(listingId?: string): Lead[] {
  const all = load().leads;
  return listingId ? all.filter((l) => l.listingId === listingId) : all;
}
export function getLeadsForOwner(ownerId: string): Lead[] {
  const db = load();
  const ids = new Set(db.listings.filter((l) => l.ownerId === ownerId).map((l) => l.id));
  // Leads via een eigen woning-advertentie én leads die rechtstreeks aan dit
  // account gekoppeld zijn (bv. mantelzorg-aanvragen voor Zorgwoning.nl).
  return db.leads.filter((l) => ids.has(l.listingId) || l.ownerId === ownerId);
}
export function addLead(data: Omit<Lead, "id" | "datum">): Lead {
  const db = load();
  const lead: Lead = { ...data, id: nextId("l-"), datum: new Date().toLocaleString("nl-NL") };
  db.leads.unshift(lead);
  save();
  return lead;
}
 
// ---------- Payments ----------
export function getPayments(): Payment[] {
  return load().payments;
}
export function getPayment(id: string): Payment | undefined {
  return load().payments.find((p) => p.id === id);
}
export function getPaymentsByUser(userId: string): Payment[] {
  return load().payments.filter((p) => p.userId === userId);
}
export function addPayment(data: Omit<Payment, "id" | "aangemaakt" | "factuurnummer">): Payment {
  const db = load();
  const jaar = new Date().getFullYear();
  const nummer = String(db.payments.length + 1).padStart(4, "0");
  const payment: Payment = {
    ...data,
    id: nextId("pay-"),
    factuurnummer: `MH-${jaar}-${nummer}`,
    aangemaakt: new Date().toISOString(),
  };
  db.payments.push(payment);
  save();
  return payment;
}
export function updatePayment(id: string, patch: Partial<Payment>): Payment | undefined {
  const db = load();
  const p = db.payments.find((x) => x.id === id);
  if (!p) return undefined;
  Object.assign(p, patch);
  save();
  return p;
}
 
// ---------- Emails ----------
// ---- Social posts (Instagram-wachtrij, voorrang voor betaalde spotlights) ----
export function getSocialPosts(): SocialPost[] {
  const db = load();
  // Voorrang eerst, daarna oudste eerst. 'geplaatst' zakt naar onderen.
  const rang = (s: SocialPost) => (s.status === "geplaatst" ? 1 : 0);
  return db.socialPosts.slice().sort((a, b) => {
    if (rang(a) !== rang(b)) return rang(a) - rang(b);
    if (a.prioriteit !== b.prioriteit) return a.prioriteit ? -1 : 1;
    return a.aangemaakt.localeCompare(b.aangemaakt);
  });
}

export function getSocialPost(id: string): SocialPost | undefined {
  return load().socialPosts.find((s) => s.id === id);
}

export function addSocialPost(data: Omit<SocialPost, "id" | "aangemaakt">): SocialPost {
  const db = load();
  const post: SocialPost = { ...data, id: nextId("sp"), aangemaakt: new Date().toISOString() };
  db.socialPosts.push(post);
  save();
  return post;
}

export function updateSocialPost(id: string, patch: Partial<SocialPost>): SocialPost | undefined {
  const db = load();
  const post = db.socialPosts.find((s) => s.id === id);
  if (!post) return undefined;
  Object.assign(post, patch);
  save();
  return post;
}

// ---- Blogposts (automatisch gegenereerd, opgeslagen in de database) ----
export function getExtraBlogPosts(): BlogPost[] {
  return load().blogPosts;
}

export function addBlogPost(post: BlogPost): BlogPost {
  const db = load();
  const i = db.blogPosts.findIndex((p) => p.slug === post.slug);
  if (i >= 0) db.blogPosts[i] = post;
  else db.blogPosts.push(post);
  save();
  return post;
}

export function removeBlogPost(slug: string): boolean {
  const db = load();
  const voor = db.blogPosts.length;
  db.blogPosts = db.blogPosts.filter((p) => p.slug !== slug);
  const weg = db.blogPosts.length !== voor;
  if (weg) save();
  return weg;
}

export function getEmails(): EmailRecord[] {
  return load().emails;
}
export function getEmail(id: string): EmailRecord | undefined {
  return load().emails.find((e) => e.id === id);
}
export function addEmail(data: Omit<EmailRecord, "id" | "datum">): EmailRecord {
  const db = load();
  const email: EmailRecord = { ...data, id: nextId("mail-"), datum: new Date().toISOString() };
  db.emails.unshift(email);
  save();
  return email;
}
 
// ---------- Huusmeesters ----------
export function getHuusmeesters(): Huusmeester[] {
  return load().huusmeesters;
}
export function addHuusmeester(data: Omit<Huusmeester, "id" | "datum">): Huusmeester {
  const db = load();
  const hm: Huusmeester = { ...data, id: nextId("hm-"), datum: new Date().toISOString() };
  db.huusmeesters.push(hm);
  save();
  return hm;
}
 
// ---------- Zoekopdrachten (woning-alerts) ----------
export function getZoekopdrachten(): Zoekopdracht[] {
  const db = load();
  if (!db.zoekopdrachten) db.zoekopdrachten = [];
  return db.zoekopdrachten;
}
export function addZoekopdracht(data: Omit<Zoekopdracht, "id" | "datum">): Zoekopdracht {
  const db = load();
  if (!db.zoekopdrachten) db.zoekopdrachten = [];
  const z: Zoekopdracht = { ...data, id: nextId("zk-"), datum: new Date().toISOString() };
  db.zoekopdrachten.unshift(z);
  save();
  return z;
}
// Past een woning bij een zoekopdracht?
export function matchtZoekopdracht(z: Zoekopdracht, l: Listing): boolean {
  if (l.status !== "live") return false;
  if (z.doel && z.doel !== "alle" && z.doel !== l.doel) return false;
  if (z.provincie && z.provincie !== "alle" && z.provincie !== l.provincie) return false;
  if (z.prijsMax && l.prijs > z.prijsMax) return false;
  if (z.personenMin && l.personen < z.personenMin) return false;
  if (z.type && z.type !== l.type) return false;
  return true;
}
// Zoekopdrachten (met alerts aan) die bij deze woning passen.
export function zoekopdrachtenVoorWoning(l: Listing): Zoekopdracht[] {
  return getZoekopdrachten().filter((z) => z.alerts && matchtZoekopdracht(z, l));
}
 
// ---------- Enquêtes ----------
export function getEnquetes(): Enquete[] {
  return load().enquetes;
}
export function addEnquete(data: Omit<Enquete, "id" | "datum">): Enquete {
  const db = load();
  const enq: Enquete = { ...data, id: nextId("enq-"), datum: new Date().toISOString() };
  db.enquetes.unshift(enq);
  save();
  return enq;
}
 
// ---------- Reviews (openbare beoordelingen) ----------
export function getReviews(): Review[] {
  // Alleen goedgekeurde, nieuwste eerst.
  return load().reviews.filter((r) => r.goedgekeurd);
}
export function getAllReviews(): Review[] {
  return load().reviews;
}
export function addReview(data: { naam: string; plaats?: string; rating: number; tekst: string; goedgekeurd?: boolean }): Review {
  const db = load();
  const rev: Review = {
    id: nextId("rev-"),
    naam: data.naam,
    plaats: data.plaats,
    rating: data.rating,
    tekst: data.tekst,
    goedgekeurd: data.goedgekeurd ?? true,
    datum: new Date().toISOString(),
  };
  db.reviews.unshift(rev);
  save();
  return rev;
}
export function setReviewGoedgekeurd(id: string, goedgekeurd: boolean): Review | undefined {
  const db = load();
  const r = db.reviews.find((x) => x.id === id);
  if (!r) return undefined;
  r.goedgekeurd = goedgekeurd;
  save();
  return r;
}
export function deleteReview(id: string): boolean {
  const db = load();
  const i = db.reviews.findIndex((x) => x.id === id);
  if (i === -1) return false;
  db.reviews.splice(i, 1);
  save();
  return true;
}
 
// ---------- Nieuwsbrief ----------
export function addNieuwsbriefLid(email: string): { nieuw: boolean } {
  const db = load();
  const e = email.trim().toLowerCase();
  if (db.nieuwsbrief.some((l) => l.email === e)) return { nieuw: false };
  db.nieuwsbrief.unshift({ id: nextId("nb-"), email: e, datum: new Date().toISOString() });
  save();
  return { nieuw: true };
}
export function getNieuwsbriefLeden(): NieuwsbriefLid[] {
  return load().nieuwsbrief;
}
export function verwijderNieuwsbriefLid(email: string): boolean {
  const db = load();
  const e = email.trim().toLowerCase();
  const voor = db.nieuwsbrief.length;
  db.nieuwsbrief = db.nieuwsbrief.filter((l) => l.email !== e);
  if (db.nieuwsbrief.length !== voor) { save(); return true; }
  return false;
}
export function getLaatsteNieuwsbriefSlug(): string | undefined {
  return load().laatsteNieuwsbriefSlug;
}
export function setLaatsteNieuwsbriefSlug(slug: string): void {
  const db = load();
  db.laatsteNieuwsbriefSlug = slug;
  save();
}
export function getLaatsteMaandrapportMaand(): string | undefined {
  return load().laatsteMaandrapportMaand;
}
export function setLaatsteMaandrapportMaand(m: string): void {
  const db = load();
  db.laatsteMaandrapportMaand = m;
  save();
}
 
// ---------- Partner-kliks (doorklikmeting) ----------
export function addPartnerklik(partner: string, url: string): PartnerKlik {
  const db = load();
  const klik: PartnerKlik = { id: nextId("klik-"), partner, url, datum: new Date().toISOString() };
  db.partnerkliks.unshift(klik);
  save();
  return klik;
}
export function getPartnerkliks(): PartnerKlik[] {
  return load().partnerkliks;
}

// ---------- AI-styling verbruik (kostenbeheersing) ----------
// Twee harde grenzen, beide instelbaar via env: per gebruiker per dag en een
// globaal dagplafond voor de hele site. Zo kan het nooit uit de hand lopen.
export function aiStylingStatus(userId: string): { mag: boolean; reden?: string; restDag: number } {
  const db = load();
  const vandaag = new Date().toISOString().slice(0, 10);
  const perUserMax = parseInt(process.env.AI_STYLING_PER_USER_DAG || "10", 10) || 10;
  const globaalMax = parseInt(process.env.AI_STYLING_MAX_DAG || "100", 10) || 100;
  const s = db.aiStyling && db.aiStyling.datum === vandaag ? db.aiStyling : { datum: vandaag, totaal: 0, perUser: {} };
  const gebruikt = s.perUser[userId] || 0;
  if (s.totaal >= globaalMax) return { mag: false, reden: "De dagelijkse limiet voor AI-styling is bereikt. Probeer het morgen weer.", restDag: 0 };
  if (gebruikt >= perUserMax) return { mag: false, reden: `Je hebt je dagelimiet van ${perUserMax} AI-impressies bereikt. Morgen kun je weer verder.`, restDag: 0 };
  return { mag: true, restDag: perUserMax - gebruikt };
}
export function aiStylingTel(userId: string): void {
  const db = load();
  const vandaag = new Date().toISOString().slice(0, 10);
  if (!db.aiStyling || db.aiStyling.datum !== vandaag) db.aiStyling = { datum: vandaag, totaal: 0, perUser: {} };
  db.aiStyling.totaal += 1;
  db.aiStyling.perUser[userId] = (db.aiStyling.perUser[userId] || 0) + 1;
  save();
}
// ---------- Statistieken (eigen, privacyvriendelijke pageview-tracking) ----------
const PAGEVIEW_CAP = 20000; // rollend venster, houdt db.json compact
 
export function addPageview(data: { path: string; ref: string; device: Pageview["device"]; vid: string }): void {
  const db = load();
  const pv: Pageview = {
    id: nextId("pv-"),
    path: data.path.slice(0, 200),
    ref: data.ref.slice(0, 60),
    device: data.device,
    vid: data.vid.slice(0, 40),
    datum: new Date().toISOString(),
  };
  db.pageviews.unshift(pv);
  if (db.pageviews.length > PAGEVIEW_CAP) db.pageviews = db.pageviews.slice(0, PAGEVIEW_CAP);
  save();
}
 
export function getPageviews(): Pageview[] {
  return load().pageviews;
}
 
// Statistiek per advertentie: weergaven (uit pageviews) en leads.
export function getListingStats(listingId: string): { weergaven: number; leads: number } {
  const db = load();
  const suffix = `/aanbod/${listingId}`;
  const weergaven = db.pageviews.filter((p) => p.path.split("?")[0].endsWith(suffix)).length;
  const leads = db.leads.filter((l) => l.listingId === listingId).length;
  return { weergaven, leads };
}
 
// ---------- Postcode → coördinaten (cache van geocoderesultaten) ----------
export function normaliseerPostcode(pc: string): string {
  return pc.toUpperCase().replace(/\s+/g, "").slice(0, 6);
}
export function getPostcodeGeoMap(): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const g of load().postcodegeo) out[g.pc] = [g.lat, g.lon];
  return out;
}
export function setPostcodeGeo(pc: string, lat: number, lon: number): boolean {
  // Alleen geldige NL-coördinaten bewaren.
  if (!(lat >= 50.5 && lat <= 53.8 && lon >= 3.2 && lon <= 7.5)) return false;
  const key = normaliseerPostcode(pc);
  if (!key) return false;
  const db = load();
  if (db.postcodegeo.some((g) => g.pc === key)) return true; // al bekend
  db.postcodegeo.push({ pc: key, lat, lon });
  save();
  return true;
}
 
export interface AnalyticsSamenvatting {
  totaalWeergaven: number;
  totaalBezoekers: number;
  vandaagWeergaven: number;
  vandaagBezoekers: number;
  weekWeergaven: number;
  weekBezoekers: number;
  gemSessieMin: number;
  perDag: { dag: string; weergaven: number; bezoekers: number }[];
  topPaginas: { path: string; aantal: number }[];
  herkomst: { ref: string; aantal: number }[];
  apparaat: { mobiel: number; tablet: number; desktop: number };
}
 
export function analyticsSamenvatting(): AnalyticsSamenvatting {
  const pvs = load().pageviews;
  const nu = Date.now();
  const dag = 24 * 60 * 60 * 1000;
  const startVandaag = new Date(new Date().toDateString()).getTime();
  const week = nu - 7 * dag;
 
  const bezoekersSet = new Set<string>();
  const vandaagV = new Set<string>();
  const weekV = new Set<string>();
  let vandaagW = 0, weekW = 0;
  const paginas = new Map<string, number>();
  const herkomst = new Map<string, number>();
  const apparaat = { mobiel: 0, tablet: 0, desktop: 0 };
  const perDagMap = new Map<string, { w: number; v: Set<string> }>();
 
  // sessies per bezoeker voor duurschatting
  const perVid = new Map<string, number[]>();
 
  for (const pv of pvs) {
    const t = new Date(pv.datum).getTime();
    bezoekersSet.add(pv.vid);
    paginas.set(pv.path, (paginas.get(pv.path) || 0) + 1);
    herkomst.set(pv.ref || "direct", (herkomst.get(pv.ref || "direct") || 0) + 1);
    if (pv.device in apparaat) (apparaat as any)[pv.device] += 1;
    if (t >= startVandaag) { vandaagW += 1; vandaagV.add(pv.vid); }
    if (t >= week) { weekW += 1; weekV.add(pv.vid); }
 
    const dagKey = pv.datum.slice(0, 10);
    const pd = perDagMap.get(dagKey) || { w: 0, v: new Set<string>() };
    pd.w += 1; pd.v.add(pv.vid); perDagMap.set(dagKey, pd);
 
    const arr = perVid.get(pv.vid) || [];
    arr.push(t); perVid.set(pv.vid, arr);
  }
 
  // Gemiddelde sessieduur: splits per bezoeker in sessies (gap > 30 min).
  const sessieDuren: number[] = [];
  for (const tijden of Array.from(perVid.values())) {
    tijden.sort((a, b) => a - b);
    let sessieStart = tijden[0];
    let vorige = tijden[0];
    for (let i = 1; i < tijden.length; i++) {
      if (tijden[i] - vorige > 30 * 60 * 1000) {
        sessieDuren.push(vorige - sessieStart);
        sessieStart = tijden[i];
      }
      vorige = tijden[i];
    }
    sessieDuren.push(vorige - sessieStart);
  }
  const gemMs = sessieDuren.length ? sessieDuren.reduce((s, d) => s + d, 0) / sessieDuren.length : 0;
 
  // Laatste 14 dagen als reeks (ook lege dagen).
  const perDag: { dag: string; weergaven: number; bezoekers: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(nu - i * dag);
    const key = d.toISOString().slice(0, 10);
    const pd = perDagMap.get(key);
    perDag.push({ dag: key, weergaven: pd?.w || 0, bezoekers: pd?.v.size || 0 });
  }
 
  const top = (m: Map<string, number>, n: number) =>
    Array.from(m.entries()).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v).slice(0, n);
 
  return {
    totaalWeergaven: pvs.length,
    totaalBezoekers: bezoekersSet.size,
    vandaagWeergaven: vandaagW,
    vandaagBezoekers: vandaagV.size,
    weekWeergaven: weekW,
    weekBezoekers: weekV.size,
    gemSessieMin: Math.round((gemMs / 60000) * 10) / 10,
    perDag,
    topPaginas: top(paginas, 8).map((x) => ({ path: x.k, aantal: x.v })),
    herkomst: top(herkomst, 6).map((x) => ({ ref: x.k, aantal: x.v })),
    apparaat,
  };
}
 
export function partnerklikTotalen(): { partner: string; aantal: number; laatste?: string }[] {
  const kliks = load().partnerkliks;
  const map = new Map<string, { aantal: number; laatste?: string }>();
  for (const k of kliks) {
    const cur = map.get(k.partner) || { aantal: 0, laatste: undefined };
    cur.aantal += 1;
    if (!cur.laatste || k.datum > cur.laatste) cur.laatste = k.datum;
    map.set(k.partner, cur);
  }
  return Array.from(map.entries())
    .map(([partner, v]) => ({ partner, aantal: v.aantal, laatste: v.laatste }))
    .sort((a, b) => b.aantal - a.aantal);
}
 

