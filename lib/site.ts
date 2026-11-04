// Twee etalages, één platform.
// Mooihuus.nl toont recreatiewoningen, Woonhuus.nl toont gewone woningen. Alles
// daarachter (database, accounts, inloggen, dashboard, CRM, facturatie) is
// gedeeld en draait op mooihuus.nl. Welke etalage een bezoeker ziet, bepaalt
// het domein; de middleware zet dat als header (x-site).
import type { Categorie, Listing } from "./types";

export type Site = "mooihuus" | "woonhuus";

export const MOOIHUUS_URL = (process.env.NEXT_PUBLIC_MOOIHUUS_URL || "https://www.mooihuus.nl").replace(/\/$/, "");
export const WOONHUUS_URL = (process.env.NEXT_PUBLIC_WOONHUUS_URL || "https://www.woonhuus.nl").replace(/\/$/, "");

export const SITES: Record<Site, { naam: string; url: string; categorie: Categorie; themaKleur: string }> = {
  mooihuus: { naam: "Mooihuus", url: MOOIHUUS_URL, categorie: "recreatie", themaKleur: "#2C6B45" },
  woonhuus: { naam: "Woonhuus", url: WOONHUUS_URL, categorie: "woonhuis", themaKleur: "#1E3A5F" },
};

// Herkent Woonhuus aan de hostnaam: woonhuus.nl, www.woonhuus.nl en lokaal
// woonhuus.localhost (voor testen). Al het andere is Mooihuus.
export function siteVanHost(host: string | null | undefined): Site {
  const h = String(host || "").toLowerCase().split(":")[0];
  return /(^|\.)woonhuus\.(nl|localhost)$/.test(h) || h === "woonhuus.localhost" ? "woonhuus" : "mooihuus";
}

export function categorieVan(l: Pick<Listing, "categorie">): Categorie {
  return l.categorie === "woonhuis" ? "woonhuis" : "recreatie";
}

export function siteVoorCategorie(c: Categorie): Site {
  return c === "woonhuis" ? "woonhuus" : "mooihuus";
}

// Volledige publieke URL van een woning op de juiste etalage.
export function woningUrl(l: Pick<Listing, "id" | "categorie">): string {
  return `${SITES[siteVoorCategorie(categorieVan(l))].url}/aanbod/${l.id}`;
}

// Paden die op Woonhuus.nl zelf bestaan. Alles daarbuiten (inloggen, dashboard,
// plaatsen, beheer, blog, Huusmeesters, ...) hoort bij Mooihuus.nl en wordt
// daarheen doorgestuurd.
export const WOONHUUS_EIGEN_PADEN = [
  /^\/$/,
  /^\/aanbod(\/.*)?$/,
  /^\/te-koop(\/.*)?$/,
  /^\/huren$/,
  /^\/over-woonhuus$/,
  /^\/favorieten$/,
  /^\/contact$/,
  /^\/faq$/,
  /^\/voorwaarden$/,
  /^\/privacy$/,
  /^\/cookies$/,
  /^\/disclaimer$/,
];
