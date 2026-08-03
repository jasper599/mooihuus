import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Listing, Lead, Payment, EmailRecord, Enquete, Huusmeester, Zoekopdracht, Review } from "./types";
import { LM_OWNER, LM_LISTINGS } from "./lm-listings";

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
  resetTokens?: { token: string; userId: string; expires: number }[];
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
  return { users: [beheerder], listings: [], leads: [], payments: [], emails: [], enquetes: [], huusmeesters: [], zoekopdrachten: [], reviews: [], seq: 100 };
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
    if (!db.listings.some((x) => x.id === l.id)) {
      db.listings.push({ ...l, ownerId: LM_OWNER.id, aangemaakt: new Date().toISOString() });
      changed = true;
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
}): User {
  const db = load();
  const type = data.type === "zakelijk" ? "zakelijk" : "particulier";
  const user: User = {
    id: nextId("u-"),
    naam: data.naam,
    email: data.email,
    wachtwoordHash: bcrypt.hashSync(data.wachtwoord, 10),
    rol: "eigenaar",
    type,
    bedrijfsnaam: type === "zakelijk" ? data.bedrijfsnaam : undefined,
    kvk: type === "zakelijk" ? data.kvk : undefined,
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
  const listing: Listing = { ...data, id: nextId("li-"), aangemaakt: new Date().toISOString() };
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
  return db.leads.filter((l) => ids.has(l.listingId));
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
