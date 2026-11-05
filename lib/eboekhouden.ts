// lib/eboekhouden.ts
// ---------------------------------------------------------------------------
// e-Boekhouden-koppeling voor Mooihuus (Huus B.V.) — REST API v1.
//
// Doel: betaalde Mooihuus-facturen (Payment-records) als verkoopfactuur in
// e-Boekhouden zetten, zodat de boekhouder de omzet automatisch binnenkrijgt.
//
// Scheiding: dit gebruikt een EIGEN Mooihuus e-Boekhouden-administratie
// (EBOEKHOUDEN_MOOIHUUS_TOKEN) en staat volledig los van de Luyten-boekhouding.
//
// Veilig: zonder EBOEKHOUDEN_MOOIHUUS_TOKEN doet dit niets. De sync-flow draait
// standaard als dry-run (toont alleen wat er geboekt zou worden).
// ---------------------------------------------------------------------------

import { getPayments, getUser, updatePayment, getListing } from "./db";
import type { Payment } from "./types";

const BASE = "https://api.e-boekhouden.nl/v1";

export function eboekhoudenEnabled(): boolean {
  return Boolean(process.env.EBOEKHOUDEN_MOOIHUUS_TOKEN);
}

// Grootboekrekening voor de advertentie-omzet. Standaard 8000; de boekhouder
// kan dit via env overrulen (EB_OMZET_LEDGER) naar de juiste rekening.
function omzetLedger(): string {
  return (process.env.EB_OMZET_LEDGER || "8000").trim();
}
function btwCode(): string {
  return (process.env.EB_BTW_CODE || "HOOG_VERK_21").trim();
}
function bron(): string {
  return (process.env.EBOEKHOUDEN_SOURCE || "Mooihuus").trim();
}

// ---- Sessie (Bearer-token ophalen met de access token) --------------------

let _sessie: { token: string; tot: number } | null = null;

async function sessieToken(): Promise<string> {
  const now = Date.now();
  if (_sessie && _sessie.tot > now + 30_000) return _sessie.token;
  const accessToken = process.env.EBOEKHOUDEN_MOOIHUUS_TOKEN;
  if (!accessToken) throw new Error("EBOEKHOUDEN_MOOIHUUS_TOKEN ontbreekt");
  const r = await fetch(`${BASE}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, source: bron() }),
  });
  if (!r.ok) throw new Error(`e-Boekhouden sessie mislukt (${r.status}): ${await r.text()}`);
  const data = await r.json();
  const token = data.token as string;
  // Token is ~uur geldig; we cachen 50 minuten.
  _sessie = { token, tot: now + 50 * 60_000 };
  return token;
}

async function ebFetch(path: string, opts: RequestInit = {}): Promise<any> {
  const token = await sessieToken();
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  const tekst = await r.text();
  if (!r.ok) throw new Error(`e-Boekhouden ${path} (${r.status}): ${tekst.slice(0, 300)}`);
  return tekst ? JSON.parse(tekst) : {};
}

// ---- Relatie (makelaar/kantoor) zoeken of aanmaken ------------------------

export async function zoekOfMaakRelatie(args: {
  naam: string;
  email?: string;
  btwNummer?: string;
  adres?: string;
  postcode?: string;
  plaats?: string;
}): Promise<number> {
  // e-Boekhouden /relation ondersteunt filteren op e-mail/term; we proberen te
  // vinden, anders maken we 'm aan.
  if (args.email) {
    try {
      const res = await ebFetch(`/relation?email=${encodeURIComponent(args.email)}`);
      const items = res.items || res || [];
      const hit = Array.isArray(items)
        ? items.find((x: any) => String(x.emailAddress || x.email || "").toLowerCase() === String(args.email).toLowerCase()) ||
          (items.length === 1 ? items[0] : undefined)
        : undefined;
      if (hit && hit.id) return hit.id;
    } catch {
      // doorgaan naar aanmaken
    }
  }
  const body: any = { name: args.naam || "Onbekende relatie", type: "B" };
  if (args.email) body.emailAddress = args.email;
  if (args.btwNummer) body.vatNumber = args.btwNummer;
  if (args.adres) body.address = args.adres;
  if (args.postcode) body.postalCode = args.postcode;
  if (args.plaats) body.city = args.plaats;
  const gemaakt = await ebFetch(`/relation`, { method: "POST", body: JSON.stringify(body) });
  return gemaakt.id;
}

// ---- Omzetrekening: code (bijv. 8010) omzetten naar het interne ledger-id ---
// De API verwacht bij een factuurregel het id van de grootboekrekening, niet
// de rekeningcode. We zoeken de code op in het rekeningschema van Huus B.V.

const _ledgers: Record<string, { code: string; id: any; omschrijving: string }> = {};

export async function omzetRekening(): Promise<{ code: string; id: any; omschrijving: string }> {
  return rekeningVanCode(omzetLedger());
}
// Debiteurenrekening (tegenrekening van een verkoopfactuur), standaard 1300.
export async function debiteurenRekening(): Promise<{ code: string; id: any; omschrijving: string }> {
  return rekeningVanCode((process.env.EB_DEBITEUREN_LEDGER || "1300").trim());
}

async function rekeningVanCode(code: string): Promise<{ code: string; id: any; omschrijving: string }> {
  if (_ledgers[code]) return _ledgers[code];
  let items: any[] = [];
  try {
    const res = await ebFetch(`/ledger?code=${encodeURIComponent(code)}`);
    items = (res && (res.items || res)) || [];
  } catch { /* hieronder het hele schema doorzoeken */ }
  let hit = Array.isArray(items) ? items.find((l: any) => String(l.code) === code) : undefined;
  if (!hit) {
    const res = await ebFetch(`/ledger?limit=2000`);
    const alle = (res && (res.items || res)) || [];
    hit = Array.isArray(alle) ? alle.find((l: any) => String(l.code) === code) : undefined;
  }
  if (!hit || hit.id === undefined || hit.id === null) throw new Error(`Grootboekrekening ${code} niet gevonden in e-Boekhouden`);
  _ledgers[code] = { code, id: hit.id, omschrijving: hit.description ?? hit.omschrijving ?? "" };
  return _ledgers[code];
}

// ---- Verkoopfactuur boeken als mutatie "Factuur verstuurd" ----------------
// We boeken de factuur alleen in de administratie (mutatie type 2), niet via de
// factuurmodule: er is geen sjabloon nodig en e-Boekhouden mailt niets. De
// factuur zelf heeft de klant al van ons gekregen. De factuur komt als open
// post op debiteuren; de Mollie-koppeling lettert de betaling af op het nummer.
export async function boekFactuurMutatie(args: {
  relationId: number;
  factuurnummer: string;
  datum?: string; // YYYY-MM-DD
  omschrijving: string;
  bedragInclBtw: number; // negatief bij een creditnota
  // Optioneel: een kortingsregel. Dan boeken we het brutobedrag plus een
  // negatieve kortingsregel (bijv. 100% welkomstactie: netto EUR 0).
  korting?: { brutoInclBtw: number; omschrijving: string };
}): Promise<any> {
  const [omzet, deb] = await Promise.all([omzetRekening(), debiteurenRekening()]);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const body = {
    type: 2,
    date: args.datum || new Date().toISOString().slice(0, 10),
    ledgerId: deb.id,
    relationId: args.relationId,
    invoiceNumber: args.factuurnummer,
    termOfPayment: 7,
    inExVat: "IN",
    description: args.omschrijving.slice(0, 200),
    rows: args.korting
      ? [
          { ledgerId: omzet.id, vatCode: btwCode(), amount: r2(args.korting.brutoInclBtw), description: args.omschrijving.slice(0, 200) },
          { ledgerId: omzet.id, vatCode: btwCode(), amount: r2(args.bedragInclBtw - args.korting.brutoInclBtw), description: args.korting.omschrijving.slice(0, 200) },
        ]
      : [
          {
            ledgerId: omzet.id,
            vatCode: btwCode(),
            amount: r2(args.bedragInclBtw),
            description: args.omschrijving.slice(0, 200),
          },
        ],
  };
  return ebFetch(`/mutation`, { method: "POST", body: JSON.stringify(body) });
}

// ---- Verkoopfactuur aanmaken (factuurmodule, niet meer gebruikt) -----------

export async function maakVerkoopfactuur(args: {
  relationId: number;
  factuurnummer?: string;
  datum?: string; // YYYY-MM-DD
  omschrijving: string;
  bedragInclBtw: number; // bruto bedrag dat de klant betaalde
  aantal?: number;
}): Promise<any> {
  const rekening = await omzetRekening();
  const item = {
    description: args.omschrijving,
    quantity: args.aantal && args.aantal > 0 ? args.aantal : 1,
    pricePerUnit:
      args.aantal && args.aantal > 0
        ? Math.round((args.bedragInclBtw / args.aantal) * 100) / 100
        : args.bedragInclBtw,
    vatCode: btwCode(),
    ledgerId: rekening.id,
  };
  const body: any = {
    relationId: args.relationId,
    date: args.datum || new Date().toISOString().slice(0, 10),
    termOfPayment: 14,
    inExVat: "IN", // bedragen zijn inclusief btw (dat is wat de klant betaalde)
    items: [item],
  };
  if (process.env.EB_TEMPLATE_ID) body.templateId = process.env.EB_TEMPLATE_ID.trim();
  if (args.factuurnummer) body.invoiceNumber = args.factuurnummer;
  return ebFetch(`/invoice`, { method: "POST", body: JSON.stringify(body) });
}

// ---- Grootboekrekeningen uitlezen (voor het kiezen van de omzetrekening) --

export interface Grootboek {
  id: any;
  code: any;
  omschrijving: any;
  categorie?: any;
}

// Leest de grootboekrekeningen uit de Huus B.V.-administratie. Met `zoek`
// filtert 'ie op omschrijving/code (bv. "advert" om de advertentie-omzet te
// vinden). Read-only; vereist EBOEKHOUDEN_MOOIHUUS_TOKEN.
export async function leesGrootboekrekeningen(zoek?: string): Promise<Grootboek[]> {
  const res = await ebFetch(`/ledger`);
  const items = (res && (res.items || res)) || [];
  const lijst: Grootboek[] = (Array.isArray(items) ? items : []).map((l: any) => ({
    id: l.id,
    code: l.code,
    omschrijving: l.description ?? l.omschrijving ?? "",
    categorie: l.category ?? l.categorie,
  }));
  if (zoek && zoek.trim()) {
    const q = zoek.trim().toLowerCase();
    return lijst.filter(
      (l) =>
        String(l.omschrijving || "").toLowerCase().includes(q) ||
        String(l.code || "").toLowerCase().includes(q),
    );
  }
  return lijst;
}

// ---- Sync: betaalde Mooihuus-facturen naar e-Boekhouden -------------------

export interface SyncVoorstel {
  paymentId: string;
  factuurnummer: string;
  klant: string;
  email: string;
  bedragInclBtw: number;
  aantal: number;
  omschrijving: string;
  datum: string;
  actie: string;
  eboekhoudenId?: string | number;
}

export interface SyncResultaat {
  ok: boolean;
  dry: boolean;
  actief: boolean;
  aantalKandidaten: number;
  geboekt: number;
  rekening?: string; // omzetrekening waarop geboekt wordt, bijv. "8010 Omzet advertenties"
  voorstellen: SyncVoorstel[];
  fouten: Array<{ paymentId: string; fout: string }>;
}

// Welke betalingen horen als factuur in de boekhouding?
// - Facturen die we zelf naar een klant sturen (makelaarsfacturen via Kolibri/
//   Realworks, verlengingen): direct bij aanmaken, betaald of niet. De Mollie-
//   koppeling in e-Boekhouden lettert de betaling af op het factuurnummer.
// - Betalingen van particulieren en opvallers: pas als ze betaald zijn (een
//   afgebroken iDEAL-betaling is geen factuur).
// - Creditnota's: altijd, als tegenboeking van de onbetaalde factuur.
function isVerstuurdeFactuur(p: Payment): boolean {
  if (p.soort === "makelaar-factuur" || p.soort === "verlenging") return true;
  if (p.soort === "opvaller" || p.soort === "creditnota") return false;
  const l = getListing(p.listingId);
  return !!l && (l.source === "kolibri" || l.source === "realworks");
}
function teBoeken(p: Payment, _alle: Payment[]): boolean {
  if (p.soort === "creditnota") return true;
  if (isVerstuurdeFactuur(p)) return true;
  return p.status === "paid" && p.bedrag > 0;
}
// Facturen van EUR 0 slaan we over, behalve de welkomstactie: die boeken we
// (bruto + 100% korting) zodat de factuurnummering in e-Boekhouden doorloopt.
function boekbaarBedrag(p: Payment): boolean {
  return p.bedrag !== 0 || !!p.welkomstactie;
}

// Aantal facturen en creditnota's dat nog naar e-Boekhouden moet (voor Beheer).
export function aantalTeBoeken(): number {
  const alle = getPayments();
  return alle.filter((p) => !p.geboektInEboekhouden && !!p.factuurnummer && boekbaarBedrag(p) && teBoeken(p, alle)).length;
}

// Boekt (of toont, bij dry-run) de betaalde facturen die nog niet in
// e-Boekhouden staan. Standaard dry-run; boekt alleen echt als dry=false
// EN EBOEKHOUDEN_MOOIHUUS_TOKEN is gezet.
export async function syncBetalingen(opts?: { dry?: boolean; limiet?: number }): Promise<SyncResultaat> {
  const dry = opts?.dry !== false;
  const actief = eboekhoudenEnabled();
  const alle = getPayments();
  const betalingen = alle
    .filter((p) => !p.geboektInEboekhouden && !!p.factuurnummer && boekbaarBedrag(p) && teBoeken(p, alle))
    // Oudste eerst, zodat een factuur altijd vóór zijn creditnota geboekt wordt.
    .sort((a, b) => (a.aangemaakt || "").localeCompare(b.aangemaakt || ""));
  const kandidaten = opts?.limiet ? betalingen.slice(0, opts.limiet) : betalingen;

  const voorstellen: SyncVoorstel[] = [];
  const fouten: Array<{ paymentId: string; fout: string }> = [];
  let geboekt = 0;

  // Controleer vooraf de omzetrekening (ook in de proefronde), zodat je ziet
  // waarop geboekt wordt en we niet halverwege stranden.
  let rekening: string | undefined;
  if (actief) {
    try {
      const r = await omzetRekening();
      const d = await debiteurenRekening();
      rekening = `${r.code} ${r.omschrijving}`.trim() + ` (tegenrekening ${d.code} ${d.omschrijving})`.replace(/\s+\)/, ")");
    } catch (e: any) {
      return { ok: false, dry, actief, aantalKandidaten: kandidaten.length, geboekt: 0, rekening: undefined, voorstellen: [], fouten: [{ paymentId: "-", fout: String(e?.message || e) }] };
    }
  }

  for (const p of kandidaten) {
    const owner = getUser(p.userId) as any;
    const naam = owner?.bedrijfsnaam || owner?.naam || `Klant ${p.userId}`;
    const basis = {
      paymentId: p.id,
      factuurnummer: p.factuurnummer,
      klant: naam,
      email: owner?.email || "",
      bedragInclBtw: p.bedrag,
      aantal: p.aantalObjecten || 1,
      omschrijving: p.omschrijving || "Advertentie op Mooihuus",
      datum: (p.aangemaakt || p.betaaldOp || "").slice(0, 10),
    };

    if (dry || !actief) {
      voorstellen.push({ ...basis, actie: actief ? "zou geboekt worden" : "e-Boekhouden niet geconfigureerd" });
      continue;
    }

    try {
      const relationId = await zoekOfMaakRelatie({
        naam,
        email: owner?.email,
        btwNummer: owner?.btw || owner?.btwNummer,
        adres: owner?.adres,
        postcode: owner?.postcode,
        plaats: owner?.plaats,
      });
      const factuur = await boekFactuurMutatie({
        relationId,
        factuurnummer: p.factuurnummer,
        datum: basis.datum || undefined,
        omschrijving: `${p.factuurnummer} ${basis.omschrijving}`,
        bedragInclBtw: p.bedrag,
        korting:
          p.welkomstactie && p.kortingBedrag
            ? { brutoInclBtw: p.bedrag + p.kortingBedrag, omschrijving: `${p.factuurnummer} ${p.kortingLabel || "Korting 100%"}` }
            : undefined,
      });
      const ebId = factuur?.id || factuur?.mutationId || "";
      updatePayment(p.id, { geboektInEboekhouden: true, eboekhoudenFactuurId: String(ebId) });
      geboekt++;
      voorstellen.push({ ...basis, actie: "geboekt", eboekhoudenId: ebId });
    } catch (e: any) {
      const fout = String(e?.message || e);
      // Factuurnummer staat al in e-Boekhouden (eerder handmatig of via een
      // andere koppeling geboekt): niet nog eens boeken, wel als geboekt markeren.
      if (/MUT_019/.test(fout)) {
        updatePayment(p.id, { geboektInEboekhouden: true, eboekhoudenFactuurId: "bestond-al" });
        voorstellen.push({ ...basis, actie: "stond al in e-Boekhouden" });
      } else {
        fouten.push({ paymentId: p.id, fout });
      }
    }
  }

  return { ok: true, dry, actief, aantalKandidaten: kandidaten.length, geboekt, rekening, voorstellen, fouten };
}
