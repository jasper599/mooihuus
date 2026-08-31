// Affiliate-huurpartners die als "ook te huur bij onze partners" op de site
// verschijnen. Elke link bevat de tracking van het affiliate-netwerk
// (TradeTracker/AWIN); een boeking via zo'n link levert Mooihuus een vergoeding.
// Nieuwe partner toevoegen = hier één regel erbij met de affiliate-link.

export interface HuurPartner {
  naam: string;
  tekst: string;
  url: string;      // affiliate-/tracking-link
  kleur?: number;   // voor de gradient-achtergrond van de kaart
}

export const HUURPARTNERS: HuurPartner[] = [
  {
    naam: "TopParken",
    tekst: "Vakantieparken door heel Nederland — van de Veluwe tot de kust.",
    url: "https://www.topparken.nl/tt/?tt=30138_12_514326_&r=%2F",
    kleur: 2,
  },
  // Volgende partners (zodra je de affiliate-links hebt):
  // { naam: "EuroParcs",   tekst: "…", url: "…", kleur: 4 },
  // { naam: "Marinaparcs", tekst: "…", url: "…", kleur: 0 },
  // { naam: "Glampings.com", tekst: "…", url: "…", kleur: 5 },
];
