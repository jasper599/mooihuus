// lib/lm-kolibri-status.ts
// ---------------------------------------------------------------------------
// Dagelijkse controle van het Luyten-aanbod (lm-*) tegen de echte status in
// Kolibri, via een alleen-lezen route van Max. Is een woning in Kolibri
// verkocht of ingetrokken (en niet opnieuw te koop of onder bod), dan gaat hij
// op Mooihuus van "live" naar "verkocht" (of "offline" bij ingetrokken).
//
// Proefstand is de standaard: dan wordt alleen gelogd wat er zou gebeuren.
// Echt aanpassen pas met LM_KOLIBRI_OPSCHONEN=live (Jasper beslist).
// Noodrem: LM_KOLIBRI_OPSCHONEN=uit.
// ---------------------------------------------------------------------------
import fs from "fs";
import path from "path";
import { getListings, updateListing } from "./db";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STAMP = path.join(DATA_DIR, "last-lm-kolibri.txt");
const DAG = 24 * 60 * 60 * 1000;
const TE_KOOP = new Set(["Available", "UnderBid", "UnderOffer", "SoldWithConditions"]);

function modus(): "proef" | "live" | "uit" {
  const w = (process.env.LM_KOLIBRI_OPSCHONEN || "proef").toLowerCase().trim();
  return w === "live" ? "live" : w === "uit" ? "uit" : "proef";
}

function moetDraaien(nu: Date): boolean {
  try {
    if (!fs.existsSync(STAMP)) return true;
    return nu.getTime() - new Date(fs.readFileSync(STAMP, "utf8").trim()).getTime() >= DAG;
  } catch {
    return true;
  }
}

export async function controleerLmTegenKolibri(opts: { forceer?: boolean } = {}): Promise<{ ok: boolean; modus: string; weg: string[]; fout?: string }> {
  const m = modus();
  if (m === "uit") return { ok: true, modus: m, weg: [] };
  const nu = new Date();
  if (!opts.forceer && !moetDraaien(nu)) return { ok: true, modus: m, weg: [] };
  const key = process.env.CRON_SECRET || "";
  const basis = (process.env.MAX_URL || "https://web-production-85f98.up.railway.app").replace(/\/$/, "");
  if (!key) return { ok: false, modus: m, weg: [], fout: "geen CRON_SECRET" };
  try {
    const r = await fetch(`${basis}/intern/kolibri-koopstatus?key=${encodeURIComponent(key)}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`Max gaf ${r.status}`);
    const d = (await r.json()) as { ok: boolean; aantal_opdrachten?: number; adressen?: Record<string, string[]> };
    const adressen = d.adressen || {};
    // Veiligheidsgrens: bij een (vrijwel) lege lijst nooit iets weghalen.
    if (!d.ok || (d.aantal_opdrachten || 0) < 50) throw new Error(`onvolledige lijst (${d.aantal_opdrachten || 0} opdrachten)`);

    const weg: string[] = [];
    for (const l of getListings()) {
      if (!l.id.startsWith("lm-") || l.status !== "live") continue;
      const st = adressen[l.id.slice(3)];
      if (!st || st.length === 0) continue; // niet gevonden: niets doen
      if (st.some((s) => TE_KOOP.has(s))) continue; // nog (of weer) te koop
      const nieuw = st.includes("Sold") ? "verkocht" : "offline";
      weg.push(`${l.id} (${st.join("/")} -> ${nieuw})`);
      if (m === "live") updateListing(l.id, { status: nieuw as any });
    }
    fs.writeFileSync(STAMP, nu.toISOString(), "utf8");
    console.log(`[lm-kolibri] ${m}: ${weg.length} woning(en) ${m === "live" ? "offline gezet" : "zouden offline gaan"}${weg.length ? ": " + weg.join(" | ") : ""}`);
    return { ok: true, modus: m, weg };
  } catch (e: any) {
    console.error("[lm-kolibri] mislukt:", e?.message || e);
    return { ok: false, modus: m, weg: [], fout: String(e?.message || e) };
  }
}
