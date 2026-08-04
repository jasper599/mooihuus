export const PROVINCIES = [
  "Groningen", "Friesland", "Drenthe", "Overijssel", "Flevoland", "Gelderland",
  "Utrecht", "Noord-Holland", "Zuid-Holland", "Zeeland", "Noord-Brabant", "Limburg",
];

export function provincieSlug(naam: string): string {
  return naam.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function provincieVanSlug(slug: string): string | undefined {
  return PROVINCIES.find((p) => provincieSlug(p) === slug);
}

// Korte, unieke introtekst per provincie (goed voor SEO en de lezer).
export function provincieIntro(naam: string): string {
  const t: Record<string, string> = {
    Gelderland: "Van de bossen van de Veluwe tot de Achterhoek — Gelderland is dé provincie voor een recreatiewoning tussen natuur en rust.",
    Drenthe: "Weidse heide, fietspaden en bos: Drenthe is geliefd bij wie tot rust wil komen in een eigen vakantiewoning.",
    Zeeland: "Strand, duinen en water binnen handbereik — Zeeland is perfect voor een recreatiewoning aan de kust.",
    Flevoland: "Aan het Veluwemeer en Zuiderzee vind je in Flevoland moderne parken met volop water- en buitenplezier.",
    "Noord-Holland": "Van de kop van Noord-Holland tot de meren bij Amsterdam — recreatiewoningen dicht bij strand én stad.",
    "Noord-Brabant": "Bourgondisch Brabant met bossen en gezellige dorpen: een fijne uitvalsbasis voor je tweede huus.",
    Limburg: "Heuvels, natuur en het Zuid-Limburgse landschap maken Limburg tot een geliefde recreatiebestemming.",
    Overijssel: "Twente en de IJsseldelta: rustige natuur en authentieke dorpen voor een heerlijke recreatiewoning.",
    Friesland: "Meren, weidsheid en de Friese cultuur — ideaal voor watersport en rust bij je vakantiewoning.",
    Utrecht: "Centraal gelegen tussen bos en heuvels: recreatiewoningen op de Utrechtse Heuvelrug en omgeving.",
    "Zuid-Holland": "Van de kust bij Noordwijk tot het Groene Hart — recreatiewoningen dicht bij zee en de Randstad.",
    Groningen: "Ruimte, rust en het weidse Groningse land: een bijzondere plek voor een eigen recreatiewoning.",
  };
  return t[naam] || `Ontdek recreatiewoningen te koop in ${naam} op Mooihuus.`;
}
