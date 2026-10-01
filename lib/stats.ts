import {
  getUsers,
  getListings,
  getLiveListings,
  getLeads,
  getPayments,
  getPageviews,
  getNieuwsbriefLeden,
  getSocialPosts,
  getAllReviews,
} from "./db";

// ------------------------------------------------------------------
// Live kerncijfers van Mooihuus, voor het beheer-dashboard (en later
// het spraak-/Jarvis-gedeelte). Eén functie die de database samenvat.
// ------------------------------------------------------------------

export interface MooihuusStats {
  tijd: string;
  woningen: {
    live: number;
    totaal: number;
    koop: number;
    huur: number;
    uitgelicht: number;
    perBron: { bron: string; aantal: number }[];
  };
  leads: { totaal: number; week: number; maand: number };
  bezoekers: { vandaag: number; week: number };
  gebruikers: { totaal: number; zakelijk: number; particulier: number };
  omzet: { maand: number; totaal: number };
  nieuwsbrief: number;
  social: { wachtrij: number };
  reviews: { goedgekeurd: number; gemiddeld: number };
}

const DAG = 24 * 60 * 60 * 1000;

function parse(s?: string): number {
  return s ? Date.parse(s) : NaN;
}

// Nette label per bron voor in het dashboard.
const BRON_LABEL: Record<string, string> = {
  eigen: "Particulier/eigen",
  luyten: "Luyten Makelaardij",
  kolibri: "Makelaars (Kolibri)",
  topparken: "TopParken",
  glampings: "Glampings.com",
  marinaparken: "Marinaparken",
  europarcs: "EuroParcs",
  belvilla: "Belvilla",
  realworks: "Makelaars (Realworks)",
};

export function bronLabel(bron: string): string {
  return BRON_LABEL[bron] || (bron ? bron.charAt(0).toUpperCase() + bron.slice(1) : "Onbekend");
}

export function berekenStats(): MooihuusStats {
  const now = Date.now();
  const sinds = (dagen: number) => now - dagen * DAG;
  const startVandaag = new Date();
  startVandaag.setHours(0, 0, 0, 0);
  const startMaand = new Date();
  startMaand.setDate(1);
  startMaand.setHours(0, 0, 0, 0);

  const live = getLiveListings();
  const alle = getListings();
  const leads = getLeads();
  const users = getUsers();
  const pv = getPageviews();
  const betaald = getPayments().filter((p) => p.status === "paid");
  const nb = getNieuwsbriefLeden();
  const social = getSocialPosts();
  const reviews = getAllReviews();

  const naDatum = (arr: { datum?: string }[], grens: number) =>
    arr.reduce((n, x) => {
      const t = parse(x.datum);
      return n + (isFinite(t) && t >= grens ? 1 : 0);
    }, 0);

  // Woningen per bron (alleen live).
  const bronMap: Record<string, number> = {};
  for (const l of live) {
    const b = l.source || "eigen";
    bronMap[b] = (bronMap[b] || 0) + 1;
  }
  const perBron = Object.entries(bronMap)
    .map(([bron, aantal]) => ({ bron: bronLabel(bron), aantal }))
    .sort((a, b) => b.aantal - a.aantal);

  const omzetMaand = betaald.reduce((s, p) => {
    const t = parse(p.betaaldOp || p.aangemaakt);
    return s + (isFinite(t) && t >= startMaand.getTime() ? p.bedrag || 0 : 0);
  }, 0);
  const omzetTotaal = betaald.reduce((s, p) => s + (p.bedrag || 0), 0);

  return {
    tijd: new Date().toISOString(),
    woningen: {
      live: live.length,
      totaal: alle.length,
      koop: live.filter((l) => l.doel === "koop").length,
      huur: live.filter((l) => l.doel === "huur").length,
      uitgelicht: live.filter((l) => l.uitgelicht).length,
      perBron,
    },
    leads: {
      totaal: leads.length,
      week: naDatum(leads, sinds(7)),
      maand: naDatum(leads, sinds(30)),
    },
    bezoekers: {
      vandaag: naDatum(pv, startVandaag.getTime()),
      week: naDatum(pv, sinds(7)),
    },
    gebruikers: {
      totaal: users.length,
      zakelijk: users.filter((u) => u.type === "zakelijk").length,
      particulier: users.filter((u) => u.type === "particulier").length,
    },
    omzet: { maand: omzetMaand, totaal: omzetTotaal },
    nieuwsbrief: nb.length,
    social: { wachtrij: social.filter((s) => s.status === "wachtrij" || s.status === "ingepland").length },
    reviews: {
      goedgekeurd: reviews.filter((r) => r.goedgekeurd).length,
      gemiddeld: reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0,
    },
  };
}
