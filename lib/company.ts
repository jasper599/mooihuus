// Bedrijfsgegevens Huus B.V. (exploitant van Mooihuus.nl).
export const COMPANY = {
  bv: "Huus B.V.",
  handelsnaam: "Mooihuus.nl",
  adres: "Vlietlaan 44 B",
  postcode: "1404 CC Bussum",
  kvk: "75241889",
  vestiging: "000043126340",
  btw: "NL860204212B01",
  email: "info@mooihuus.nl",
  privacyEmail: "info@mooihuus.nl",
  website: "https://www.mooihuus.nl",
};

export const LAATST_BIJGEWERKT = "november 2026";

// Afzender van factuurmails: altijd op naam van Huus B.V. Het adres komt uit
// MAIL_FROM_FACTUUR (als die is ingesteld), anders facturen@mooihuus.nl.
export function factuurAfzender(): string {
  const env = process.env.MAIL_FROM_FACTUUR || "";
  const m = env.match(/<([^>]+)>/);
  const adres = (m ? m[1] : env.includes("@") ? env.trim() : "") || "facturen@mooihuus.nl";
  return `Huus B.V. <${adres}>`;
}
