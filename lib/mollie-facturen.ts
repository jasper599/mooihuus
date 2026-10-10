// lib/mollie-facturen.ts
// ---------------------------------------------------------------------------
// Fase 2 — Mollie's eigen fee-facturen (de kosten die Mollie aan Mooihuus /
// Huus B.V. rekent) uitlezen, zodat ze in e-Boekhouden geboekt kunnen worden.
//
// De Mollie Invoices-API vereist een access token met de scope `invoices.read`
// (een "Advanced access token" of OAuth) — NIET de gewone MOLLIE_API_KEY.
// Zet dat token als MOLLIE_ORG_TOKEN. Zonder token doet dit niets.
// ---------------------------------------------------------------------------

const MOLLIE_API = "https://api.mollie.com/v2";

export function mollieOrgTokenAanwezig(): boolean {
  return Boolean(process.env.MOLLIE_ORG_TOKEN);
}

export interface MollieFactuur {
  id: string;
  referentie: string;
  status: string; // open | paid | overdue
  datum: string; // YYYY-MM-DD
  netto: number; // excl. btw
  btw: number; // btw-bedrag
  bruto: number; // incl. btw
  valuta: string;
}

// Haalt de (laatste) fee-facturen van Mollie op. Standaard 25.
export async function leesMollieFacturen(opts?: { limit?: number }): Promise<MollieFactuur[]> {
  const token = process.env.MOLLIE_ORG_TOKEN;
  if (!token) throw new Error("MOLLIE_ORG_TOKEN ontbreekt (Mollie access token met invoices.read)");
  const limit = opts?.limit && opts.limit > 0 ? Math.min(opts.limit, 250) : 25;
  const r = await fetch(`${MOLLIE_API}/invoices?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tekst = await r.text();
  if (!r.ok) throw new Error(`Mollie facturen (${r.status}): ${tekst.slice(0, 300)}`);
  const data = tekst ? JSON.parse(tekst) : {};
  const facturen = data?._embedded?.invoices || [];
  return facturen.map((f: any): MollieFactuur => ({
    id: f.id,
    referentie: f.reference || "",
    status: f.status || "",
    datum: (f.issuedAt || "").slice(0, 10),
    netto: Number(f.netAmount?.value || 0),
    btw: Number(f.vatAmount?.value || 0),
    bruto: Number(f.grossAmount?.value || 0),
    valuta: f.grossAmount?.currency || "EUR",
  }));
}
