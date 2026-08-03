// Suggesties voor "uitjes in de buurt" per provincie/regio.
// Nu een ingebouwde lijst; later te vervangen door een echte bron op
// postcode-niveau (bijv. een attracties-API of open dataset).

export const UITJES_PER_REGIO: Record<string, string[]> = {
  // Provincies
  Groningen: ["Groninger Museum", "Wadlopen naar de eilanden", "Landgoed Nienoord", "Fietsen door het Reitdiepdal", "Terras aan de Grote Markt"],
  Friesland: ["Varen op de Friese meren", "Dagtrip naar een Waddeneiland", "Watersport in Sneek", "AquaZoo Leeuwarden", "Kanoën door de natuur"],
  Drenthe: ["Wildlands Adventure Zoo Emmen", "Hunebedcentrum", "Fietsen door de bossen", "Drents Museum", "Sterrenwacht bij nacht"],
  Overijssel: ["Varen door Giethoorn", "Nationaal Park Weerribben-Wieden", "Hanzestad Deventer", "Fietsen langs de Vecht", "Dierenpark in de buurt"],
  Flevoland: ["Walibi Holland", "Batavia Stad Fashion Outlet", "Oostvaardersplassen", "Watersport op het Veluwemeer", "Aviodrome Lelystad"],
  Gelderland: ["Nationaal Park De Hoge Veluwe", "Kröller-Müller Museum", "Apenheul", "Burgers' Zoo Arnhem", "Nederlands Openluchtmuseum"],
  Utrecht: ["Nationaal Park Utrechtse Heuvelrug", "Kasteel de Haar", "Domtoren beklimmen", "Nijntje Museum", "Fietsen langs de Vecht"],
  "Noord-Holland": ["Strand van Zandvoort", "Zaanse Schans", "Dagtrip naar Amsterdam", "Wandelen in de duinen", "Varen op het Markermeer"],
  "Zuid-Holland": ["Strand van Noordwijk", "Keukenhof (in het seizoen)", "Madurodam", "Molens van Kinderdijk", "Dagje Den Haag"],
  Zeeland: ["Strand van Domburg", "Deltapark Neeltje Jans", "Watersport op de Oosterschelde", "Vestingstad Veere", "Oesters proeven in Yerseke"],
  "Noord-Brabant": ["De Efteling", "Safaripark Beekse Bergen", "Loonse en Drunense Duinen", "Wandelen in de Biesbosch", "Gezellig terras in Den Bosch"],
  Limburg: ["Wandelen in het Heuvelland", "Thermae 2000 Valkenburg", "GaiaZOO Kerkrade", "Fietsen door de Maasvallei", "Grotten van Valkenburg"],
  // Bekende regio's (extra)
  Veluwe: ["Nationaal Park De Hoge Veluwe", "Apenheul", "Julianatoren", "Kröller-Müller Museum", "Fietsen over de zandverstuiving"],
  Twente: ["Coulisselandschap fietsen", "Kasteel Twickel", "Wandelen in het Hof van Twente", "Recreatie aan het Rutbeek", "Bezoek Enschede centrum"],
};

export function suggestUitjes(provincie: string): string[] {
  return (
    UITJES_PER_REGIO[provincie] ?? [
      "Wandelroutes in de omgeving",
      "Fietsroutes door de natuur",
      "Zwemmen in de buurt",
      "Lokale weekmarkt",
      "Gezellig terras in het dorp",
    ]
  );
}
