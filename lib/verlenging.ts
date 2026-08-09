// Automatische verlenging van advertenties.
//
// Een advertentie staat 1 jaar online. Deze module:
//  - houdt per betaalde, zelfgeplaatste advertentie de looptijd bij (periodeStart
//    of anders de betaaldatum van de oorspronkelijke advertentie-betaling);
//  - stuurt 30 dagen vóór afloop een verlengmail met een iDEAL-betaallink;
//  - zet de advertentie op de einddatum offline als er niet is verlengd
//    (en stuurt dan een korte 'verlopen'-mail met dezelfde link);
//  - de verlengprijs is precies wat de klant destijds voor die woning betaalde.
//
// Alleen woningen mét een geslaagde advertentie-betaling doen mee — daarmee
// vallen het geïmporteerde Luyten-/Parqio-aanbod en beheerderswoningen er
// vanzelf buiten (die hebben geen betaling).

import {
  getListings, getUser, getPayments, addPayment, updatePayment, updateListing, getListing,
} from "./db";
import { mollieEnabled, createMolliePayment } from "./mollie";
import { renderVerlengHerinnering, renderVerlengVerlopen, sendEmail } from "./email";
import { COMPANY } from "./company";
import { Listing } from "./types";

const DAG = 24 * 60 * 60 * 1000;
const HERINNER_DAGEN = 30;

function baseUrl(): string {
  return process.env.NEXTAUTH_URL || COMPANY.website;
}

// De geslaagde advertentie-betaling die deze woning activeerde (voor startdatum
// én het bedrag dat destijds is betaald).
export function advertentieBetaling(listing: Listing) {
  return getPayments()
    .filter(
      (p) =>
        p.listingId === listing.id &&
        p.status === "paid" &&
        (p.soort === "advertentie" || p.soort === undefined || p.soort === "verlenging")
    )
    .sort((a, b) => (b.betaaldOp || b.aangemaakt).localeCompare(a.betaaldOp || a.aangemaakt))[0];
}

// Startdatum van het huidige jaar. periodeStart wint; anders de betaaldatum.
function periodeStart(listing: Listing): string | null {
  if (listing.periodeStart) return listing.periodeStart;
  const bet = advertentieBetaling(listing);
  return bet?.betaaldOp || null;
}

export function verloopDatum(listing: Listing): Date | null {
  const start = periodeStart(listing);
  if (!start) return null;
  const d = new Date(start);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

// Het bedrag dat de klant destijds voor deze woning betaalde (voor de verlenging).
function oorspronkelijkBedrag(listing: Listing): number {
  const bet = advertentieBetaling(listing);
  return bet?.bedrag ?? 0;
}

// Maakt één verleng-betaling voor een set woningen van dezelfde eigenaar en
// levert de betaallink. Bedrag = som van wat er destijds per woning is betaald.
async function maakVerlengBetaling(ownerId: string, listings: Listing[]): Promise<{ betaalUrl: string; bedrag: number; factuurnummer: string } | null> {
  if (listings.length === 0) return null;
  const bedrag = Math.round(listings.reduce((s, l) => s + oorspronkelijkBedrag(l), 0) * 100) / 100;
  if (bedrag <= 0) return null;

  const titels = listings.map((l) => l.titel).join(", ");
  const payment = addPayment({
    listingId: listings[0].id,
    userId: ownerId,
    pakket: listings[0].pakket,
    bedrag,
    status: "open",
    methode: "iDEAL",
    soort: "verlenging",
    listingIds: listings.map((l) => l.id),
    omschrijving: `Verlenging ${listings.length} woning${listings.length > 1 ? "en" : ""} — ${titels}`.slice(0, 180),
  });

  let betaalUrl = `${baseUrl()}/betaling/${payment.id}`;
  if (mollieEnabled()) {
    try {
      const { mollieId, checkoutUrl } = await createMolliePayment({
        bedrag,
        beschrijving: `Mooihuus verlenging — ${listings.length} woning(en)`,
        redirectUrl: `${baseUrl()}/betaling/${payment.id}`,
        webhookUrl: `${baseUrl()}/api/webhook/mollie`,
      });
      updatePayment(payment.id, { mollieId });
      betaalUrl = checkoutUrl || betaalUrl;
    } catch {
      // val terug op interne betaalpagina
    }
  }
  return { betaalUrl, bedrag, factuurnummer: payment.factuurnummer };
}

type Samenvatting = { herinnerd: number; verlopen: number; mails: number };

// Hoofdroutine — dagelijks aan te roepen (cron-endpoint of beheerknop).
export async function verwerkVerlopendeAdvertenties(nu = new Date()): Promise<Samenvatting> {
  const res: Samenvatting = { herinnerd: 0, verlopen: 0, mails: 0 };

  // Kandidaten: live woningen met een betaalde advertentie (dus geen feed/beheer).
  const live = getListings({ status: "live" }).filter((l) => !!advertentieBetaling(l));

  // Per eigenaar verzamelen: te herinneren (≤30 dagen) en verlopen (over datum).
  const herinnerPerOwner = new Map<string, Listing[]>();
  const verlopenPerOwner = new Map<string, Listing[]>();
  const push = (m: Map<string, Listing[]>, k: string, v: Listing) => {
    const arr = m.get(k) ?? [];
    arr.push(v);
    m.set(k, arr);
  };

  for (const l of live) {
    const eind = verloopDatum(l);
    if (!eind) continue;
    const resterend = eind.getTime() - nu.getTime();

    if (resterend <= 0) {
      // Verlopen → offline zetten.
      updateListing(l.id, { status: "offline" });
      if (!l.verlengVerlopen) push(verlopenPerOwner, l.ownerId, l);
    } else if (resterend <= HERINNER_DAGEN * DAG) {
      if (!l.verlengHerinnerd) push(herinnerPerOwner, l.ownerId, l);
    }
  }

  // Herinneringen (30 dagen vooraf).
  for (const [ownerId, lijst] of Array.from(herinnerPerOwner.entries())) {
    const owner = getUser(ownerId);
    if (!owner) continue;
    const bet = await maakVerlengBetaling(ownerId, lijst);
    if (!bet) continue;
    const eersteEind = verloopDatum(lijst[0]);
    const mail = renderVerlengHerinnering({
      naam: owner.bedrijfsnaam || owner.naam,
      woningen: lijst.map((l) => ({ titel: l.titel, verlooptOp: verloopDatum(l)! })),
      bedrag: bet.bedrag,
      betaalUrl: bet.betaalUrl,
      vervalDatum: eersteEind || nu,
    });
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html });
    lijst.forEach((l) => updateListing(l.id, { verlengHerinnerd: nu.toISOString() }));
    res.herinnerd += lijst.length;
    res.mails += 1;
  }

  // Verlopen (offline + mail).
  for (const [ownerId, lijst] of Array.from(verlopenPerOwner.entries())) {
    const owner = getUser(ownerId);
    if (!owner) continue;
    const bet = await maakVerlengBetaling(ownerId, lijst);
    if (!bet) continue;
    const mail = renderVerlengVerlopen({
      naam: owner.bedrijfsnaam || owner.naam,
      woningen: lijst.map((l) => ({ titel: l.titel })),
      bedrag: bet.bedrag,
      betaalUrl: bet.betaalUrl,
    });
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "factuur", html: mail.html });
    lijst.forEach((l) => updateListing(l.id, { verlengVerlopen: nu.toISOString() }));
    res.verlopen += lijst.length;
    res.mails += 1;
  }

  return res;
}

// Wordt aangeroepen na een geslaagde verleng-betaling (vanuit payments.ts):
// zet de woningen weer live, start een nieuw jaar en wis de mail-markers.
export function activeerVerlenging(listingIds: string[], nu = new Date()): void {
  for (const id of listingIds) {
    const l = getListing(id);
    if (!l) continue;
    updateListing(id, {
      status: "live",
      periodeStart: nu.toISOString(),
      verlengHerinnerd: undefined,
      verlengVerlopen: undefined,
    });
  }
}
