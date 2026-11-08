// Versie van de algemene voorwaarden en huisregels. Wordt bij het akkoord
// vastgelegd. Akkoord geven is eenmalig per profiel: wie eenmaal akkoord gaf,
// krijgt de vraag nooit opnieuw (ook niet bij een nieuwe versie).
export const VOORWAARDEN_VERSIE = "2026-11-08";
export const VOORWAARDEN_VERSIE_LABEL = "8 november 2026";

export type VoorwaardenAkkoord = {
  versie: string;
  datum: string; // ISO-tijdstip van het akkoord
  via: "registratie" | "plaatsen" | "dashboard";
};

export function maakAkkoord(via: VoorwaardenAkkoord["via"]): VoorwaardenAkkoord {
  return { versie: VOORWAARDEN_VERSIE, datum: new Date().toISOString(), via };
}

export function heeftAkkoord(a?: VoorwaardenAkkoord): boolean {
  return !!a;
}
