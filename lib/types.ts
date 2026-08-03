export type Doel = "koop" | "huur";
export type Pakket = "Basis" | "Plus" | "Premium";
export type ListingStatus = "concept" | "wacht_op_betaling" | "live" | "verkocht" | "offline";
export type PaymentStatus = "open" | "paid" | "failed";
export type Rol = "eigenaar" | "beheerder";
export type AccountType = "particulier" | "zakelijk";

export interface User {
  id: string;
  naam: string;
  email: string;
  wachtwoordHash: string;
  rol: Rol;
  type: AccountType;
  bedrijfsnaam?: string;
  kvk?: string;
  aangemaakt: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  titel: string;
  type: string;
  doel: Doel;
  provincie: string;
  park: string;
  personen: number;
  m2: number;
  prijs: number;
  prijsSuffix?: string; // "k.k.", "v.o.n.", "excl. btw", "per week", ...
  omschrijving: string;
  kleur: number;
  pakket: Pakket;
  status: ListingStatus;
  postcode?: string;
  uitjes?: string[];
  uitgelicht?: boolean;
  promotedAt?: string;
  fotos?: string[];
  // Uitgebreide kenmerken (Funda-stijl), optioneel
  bouwjaar?: number;
  slaapkamers?: number;
  perceel?: number; // perceeloppervlakte in m²
  grond?: string; // bijv. "Eigen grond" of "Erfpacht"
  kosten?: string; // bijv. "€ 1.250 servicekosten p/j"
  energielabel?: string;
  aangemaakt: string;
}

export interface Huusmeester {
  id: string;
  bedrijf: string;
  naam: string;
  vak: string;
  regio: string;
  email: string;
  datum: string;
}

export interface Lead {
  id: string;
  listingId: string;
  naam: string;
  email: string;
  bericht: string;
  datum: string;
}

export interface Payment {
  id: string;
  listingId: string;
  userId: string;
  pakket: Pakket;
  bedrag: number; // in euro's
  status: PaymentStatus;
  factuurnummer: string;
  methode: string;
  kortingPct?: number;
  soort?: "advertentie" | "opvaller";
  omschrijving?: string;
  mollieId?: string;
  aangemaakt: string;
  betaaldOp?: string;
}

export interface Zoekopdracht {
  id: string;
  naam: string;
  email: string;
  doel: "koop" | "huur" | "alle";
  provincie: string; // "alle" of een provincienaam
  prijsMax?: number;
  personenMin?: number;
  type?: string; // optioneel woningtype
  alerts: boolean; // e-mail bij een match
  datum: string;
}

export interface Enquete {
  id: string;
  userId?: string;
  listingId?: string;
  rating: number; // 1-5
  aanbeveling?: number; // 0-10 (NPS-achtig), optioneel
  opmerking: string;
  datum: string;
}

export interface Review {
  id: string;
  naam: string;
  plaats?: string;
  rating: number; // 1-5
  tekst: string;
  goedgekeurd: boolean; // zichtbaar op de site
  datum: string;
}

export interface EmailRecord {
  id: string;
  aan: string;
  onderwerp: string;
  soort: "welkom" | "betalingsbewijs" | "lead" | "contact" | "alert";
  html: string;
  verzondenVia: "smtp" | "preview";
  datum: string;
}
