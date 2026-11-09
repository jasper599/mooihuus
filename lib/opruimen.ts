// Bewaartermijnen woningen (afgesproken met Jasper, nov 2026):
//   concept / nooit betaald : 30 dagen
//   verlopen (offline)      : 6 maanden  (zo lang kan de eigenaar nog verlengen)
//   verkocht                : 3 maanden
// Woningen uit makelaarsfeeds (Kolibri, Realworks, ...) volgen de feed; daarvan
// ruimen we alleen verkochte woningen op. Offline feed-aanbod (bijv. wachtend op
// de jaarfactuur van een kantoor) blijft staan.
//
// Veiligheid: zolang OPRUIMEN_AAN niet "1" is, verwijdert dit niets en stuurt het
// hooguit één keer per week een droge-proef-overzicht naar Jasper.
import fs from "fs";
import path from "path";
import { getListings, ruimWoningOp, startStatusKlok } from "./db";
import { sendEmail, renderSimpel } from "./email";
import { COMPANY } from "./company";
import type { Listing } from "./types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const RAPPORT_STAMP = path.join(DATA_DIR, "opruimen-droge-proef.txt");
const AAN = process.env.GUUS_MAIL_AAN || "jasper@luytenmakelaardij.nl";
const DAG = 86400_000;

export const TERMIJN_DAGEN: Record<string, number> = { concept: 30, wacht_op_betaling: 30, offline: 182, verkocht: 91 };

function komtInAanmerking(l: Listing, nu: number): boolean {
  const dagen = TERMIJN_DAGEN[l.status];
  if (!dagen || !l.statusSinds) return false;
  if (l.source && l.status !== "verkocht") return false; // feed-aanbod: alleen verkocht opruimen
  return nu - new Date(l.statusSinds).getTime() >= dagen * DAG;
}

export async function draaiOpruimen(): Promise<{ kandidaten: number; verwijderd: number }> {
  const nu = Date.now();
  // Start de klok voor woningen zonder statusdatum. Concepten tellen vanaf aanmaak.
  startStatusKlok(Object.keys(TERMIJN_DAGEN));

  const kandidaten = getListings().filter((l) => komtInAanmerking(l, nu));
  if (!kandidaten.length) return { kandidaten: 0, verwijderd: 0 };

  if (process.env.OPRUIMEN_AAN === "1") {
    let n = 0;
    for (const l of kandidaten) if (ruimWoningOp(l.id)) n++;
    console.log(`[opruimen] ${n} woningen opgeruimd (bewaartermijn verstreken)`);
    return { kandidaten: kandidaten.length, verwijderd: n };
  }

  // Droge proef: hooguit één keer per 7 dagen een overzicht mailen.
  let laatst = 0;
  try { laatst = new Date(fs.readFileSync(RAPPORT_STAMP, "utf8").trim()).getTime() || 0; } catch { /* nooit */ }
  if (nu - laatst < 7 * DAG) return { kandidaten: kandidaten.length, verwijderd: 0 };

  const perStatus: Record<string, number> = {};
  for (const l of kandidaten) perStatus[l.status] = (perStatus[l.status] || 0) + 1;
  const naam: Record<string, string> = { concept: "Concept", wacht_op_betaling: "Nooit betaald", offline: "Verlopen", verkocht: "Verkocht" };
  const rijen = kandidaten.slice(0, 60).map((l) =>
    `<tr><td>${(l.titel || "").replace(/</g, "&lt;")}</td><td>${l.provincie || ""}</td><td>${naam[l.status] || l.status}</td><td>${(l.statusSinds || "").slice(0, 10)}</td><td>${l.source || "particulier"}</td></tr>`
  ).join("");
  const html = `
    <p>Hoi Jasper,</p>
    <p>Droge proef van het opruimen: deze woningen zouden nu weg gaan omdat de bewaartermijn verstreken is. Er is <strong>nog niets verwijderd</strong>.</p>
    <p>${Object.entries(perStatus).map(([s, n]) => `${naam[s] || s}: <strong>${n}</strong>`).join(" · ")} (totaal ${kandidaten.length})</p>
    <table cellpadding="4" style="border-collapse:collapse;font-size:13px"><tr><th align="left">Woning</th><th align="left">Provincie</th><th align="left">Status</th><th align="left">Sinds</th><th align="left">Bron</th></tr>${rijen}</table>
    ${kandidaten.length > 60 ? `<p>… en nog ${kandidaten.length - 60} meer.</p>` : ""}
    <p>Klopt dit? Laat het Claude weten, dan zetten we het opruimen echt aan. Betalingen en facturen blijven altijd bewaard.</p>
    <p>Guus</p>`;
  const mail = renderSimpel("Droge proef: woningen opruimen", html);
  await sendEmail({ aan: AAN, onderwerp: "🧹 " + mail.onderwerp, soort: "alert", html: mail.html, van: `Guus <${COMPANY.email}>` });
  try { fs.writeFileSync(RAPPORT_STAMP, new Date(nu).toISOString(), "utf8"); } catch { /* niet fataal */ }
  return { kandidaten: kandidaten.length, verwijderd: 0 };
}
