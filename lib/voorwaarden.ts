// Versie van de algemene voorwaarden en huisregels. Verhoog dit bij elke
// inhoudelijke wijziging: wie op een oudere versie akkoord gaf, krijgt dan
// in het dashboard opnieuw de vraag om akkoord te geven.
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

export function heeftActueelAkkoord(a?: VoorwaardenAkkoord): boolean {
  return !!a && a.versie === VOORWAARDEN_VERSIE;
}
