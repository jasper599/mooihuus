// Interne dagelijkse scheduler — draait binnen het Node-proces van de server.
//
// Doet één keer per kalenderdag (UTC): de database-back-up en de verloop-/
// verlengcheck. Een datumstempel op het volume voorkomt dubbel draaien, ook
// over herstarts/deploys heen. Nooit fataal: fouten worden opgevangen zodat de
// server blijft draaien.

import fs from "fs";
import path from "path";
import { maakBackup } from "./backup";
import { verwerkVerlopendeAdvertenties } from "./verlenging";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STAMP_FILE = path.join(DATA_DIR, "last-onderhoud.txt");
const INTERVAL = 30 * 60 * 1000; // elke 30 minuten kijken of het al gedraaid is

function vandaag(d = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function alGedraaidVandaag(): boolean {
  try {
    return fs.existsSync(STAMP_FILE) && fs.readFileSync(STAMP_FILE, "utf8").trim() === vandaag();
  } catch {
    return false;
  }
}

function markeer(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STAMP_FILE, vandaag(), "utf8");
  } catch {
    /* niet fataal */
  }
}

let bezig = false;
async function draaiDagelijks(): Promise<void> {
  if (bezig || alGedraaidVandaag()) return;
  bezig = true;
  try {
    await maakBackup().catch(() => {});
    await verwerkVerlopendeAdvertenties().catch(() => {});
    markeer(); // pas markeren als beide klaar zijn (crasht het eerder, dan retry volgende tick)
  } finally {
    bezig = false;
  }
}

let gestart = false;
export function startScheduler(): void {
  if (gestart) return;
  gestart = true;
  // Korte vertraging na opstart, dan periodiek. De eerste run gebeurt dus vlak
  // na deploy als er die dag nog niet is gedraaid.
  setTimeout(() => { void draaiDagelijks(); }, 20000);
  setInterval(() => { void draaiDagelijks(); }, INTERVAL);
}
