// Benaderende middelpunten (centroïden) van de Nederlandse provincies.
// Gebruikt om woningen op de kaart te plaatsen op provincieniveau — we hebben
// (nog) geen exacte coördinaten per woning, dus we clusteren rond de provincie
// en spreiden meerdere woningen met een kleine deterministische offset.
export const PROVINCIE_CENTROID: Record<string, [number, number]> = {
  Groningen: [53.219, 6.568],
  Friesland: [53.164, 5.782],
  Fryslân: [53.164, 5.782],
  Drenthe: [52.862, 6.62],
  Overijssel: [52.439, 6.5],
  Flevoland: [52.527, 5.595],
  Gelderland: [52.06, 5.94],
  Utrecht: [52.09, 5.18],
  "Noord-Holland": [52.6, 4.84],
  "Zuid-Holland": [51.98, 4.47],
  Zeeland: [51.49, 3.85],
  "Noord-Brabant": [51.56, 5.09],
  Limburg: [51.2, 5.94],
};

// Deterministische kleine verschuiving zodat woningen in dezelfde provincie
// niet exact op elkaar liggen. Op basis van de index — geen willekeur nodig.
// Strak gehouden zodat de huisjes netjes rond het provinciecentrum clusteren
// en niet in zee of een buurprovincie belanden.
export function scatter(base: [number, number], i: number, spread = 1): [number, number] {
  const angle = (i * 137.508 * Math.PI) / 180; // gulden hoek → mooie spreiding
  const r = (0.02 + (i % 6) * 0.009) * spread; // provincieval ~2–7 km; park ~klein
  return [base[0] + Math.sin(angle) * r, base[1] + Math.cos(angle) * r * 1.15];
}
