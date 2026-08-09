// Dagelijkse back-up van de database (db.json).
//
// Twee lagen bescherming:
//  1. Op het Railway-volume: een geroteerde kopie (laatste 14 bewaard) — beschermt
//     tegen een corrupte schrijfactie, een foute migratie of per ongeluk wissen.
//  2. Off-site: de back-up wordt als bijlage naar BACKUP_EMAIL (of het bedrijfs-
//     adres) gemaild — beschermt tegen totaal verlies van het volume.
//
// Terugzetten: pak de meest recente db-*.json (uit de mailbijlage of de map
// backups/ op het volume) en zet die terug als db.json.

import fs from "fs";
import path from "path";
import { sendEmail } from "./email";
import { COMPANY } from "./company";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const BEWAAR = 14; // aantal dagkopieën op het volume

export async function maakBackup(nu = new Date()): Promise<{
  ok: boolean;
  reden?: string;
  bestand?: string;
  opVolume?: number;
  gemaild?: boolean;
  bytes?: number;
}> {
  if (!fs.existsSync(DB_FILE)) return { ok: false, reden: "db.json niet gevonden" };
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const stamp = nu.toISOString().replace(/[:.]/g, "-").slice(0, 19); // 2026-08-10T03-00-00
  const naam = `db-${stamp}.json`;
  const data = fs.readFileSync(DB_FILE);
  fs.writeFileSync(path.join(BACKUP_DIR, naam), data);

  // Rotatie: bewaar alleen de nieuwste BEWAAR kopieën.
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("db-") && f.endsWith(".json"))
    .sort();
  for (const f of files.slice(0, Math.max(0, files.length - BEWAAR))) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch { /* niet fataal */ }
  }

  // Off-site kopie via e-mail (alleen als Resend is ingesteld).
  let gemaild = false;
  const naar = process.env.BACKUP_EMAIL || COMPANY.email;
  if (naar && process.env.RESEND_API_KEY) {
    try {
      await sendEmail({
        aan: naar,
        onderwerp: `Mooihuus back-up · ${stamp}`,
        soort: "rapport",
        html:
          `<p>Automatische dagelijkse back-up van de Mooihuus-database.</p>` +
          `<p>Bestand: <strong>${naam}</strong> (${(data.length / 1024).toFixed(0)} kB). ` +
          `Bewaar deze mail — je kunt de database hieruit terugzetten als er ooit iets misgaat.</p>`,
        attachments: [{ filename: naam, content: data.toString("base64"), contentType: "application/json" }],
      });
      gemaild = true;
    } catch { /* off-site mislukt, volume-kopie staat er wel */ }
  }

  return { ok: true, bestand: naam, opVolume: Math.min(files.length, BEWAAR), gemaild, bytes: data.length };
}
