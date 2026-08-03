import { Pakket } from "./types";

export const PAKKET_PRIJS: Record<Pakket, number> = {
  Basis: 25,
  Plus: 49,
  Premium: 79,
};

export const PAKKET_INFO: Record<Pakket, { sub: string; feats: string[] }> = {
  Basis: { sub: "eenmalig · 1 jaar online", feats: ["Tot 12 foto's", "AI-basistekst", "Leads direct naar jou"] },
  Plus: { sub: "eenmalig · tot verkocht", feats: ["20 foto's + plattegrond", "Volledige AI-assistent", "Hoger in resultaten", "Contracthulp"] },
  Premium: { sub: "eenmalig", feats: ["Uitgelicht op home", "Social spotlight", "Voorrang Huusmeesters"] },
};

// Volumekorting voor (zakelijke) accounts met meerdere objecten.
// Vanaf 5 objecten: 15% korting, vanaf 10 objecten: 25% korting.
export function volumeKortingPct(aantalObjecten: number): number {
  if (aantalObjecten >= 10) return 25;
  if (aantalObjecten >= 5) return 15;
  return 0;
}

export function prijsMetKorting(pakket: Pakket, aantalObjecten: number): { bedrag: number; pct: number; basis: number } {
  const basis = PAKKET_PRIJS[pakket];
  const pct = volumeKortingPct(aantalObjecten);
  const bedrag = Math.round(basis * (1 - pct / 100) * 100) / 100;
  return { bedrag, pct, basis };
}

export const OPVALLERS: { id: string; naam: string; prijs: number; omschrijving: string }[] = [
  { id: "Omhoog", naam: "Omhoog", prijs: 1.95, omschrijving: "Zet je advertentie weer bovenaan de lijst" },
  { id: "Dagtopper", naam: "Dagtopper", prijs: 2.95, omschrijving: "1 dag bovenaan de zoekresultaten" },
  { id: "Blikvanger", naam: "Blikvanger", prijs: 4.95, omschrijving: "Uitgelicht met opvallende opmaak" },
  { id: "Social spotlight", naam: "Social spotlight", prijs: 9.95, omschrijving: "Aparte post op onze socials" },
];

export function euro(n: number): string {
  return "€ " + n.toLocaleString("nl-NL", { minimumFractionDigits: 0 });
}

export function euroCents(n: number): string {
  return "€ " + n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
