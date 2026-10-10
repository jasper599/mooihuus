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

import { getPayments, getUser, updatePayment } from "./db";

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
      if (Array.isArray(items) && items.length && items[0].id) return items[0].id;
    } catch {
      // doorgaan naar aanmaken
    }
  }
  const body: any = { name: args.naam || "Onbekende relatie" };
  if (args.email) body.emailAddress = args.email;
  if (args.btwNummer) body.vatNumber = args.btwNummer;
  if (args.adres) body.address = args.adres;
  if (args.postcode) body.postalCode = args.postcode;
  if (args.plaats) body.city = args.plaats;
  const gemaakt = await ebFetch(`/relation`, { method: "POST", body: JSON.stringify(body) });
  return gemaakt.id;
}

// ---- Verkoopfactuur aanmaken ----------------------------------------------

export async function maakVerkoopfactuur(args: {
  relationId: number;
  factuurnummer?: string;
  datum?: string; // YYYY-MM-DD
  omschrijving: string;
  bedragInclBtw: number; // bruto bedrag dat de klant betaalde
  aantal?: number;
}): Promise<any> {
  const item = {
    description: args.omschrijving,
    quantity: args.aantal && args.aantal > 0 ? args.aantal : 1,
    pricePerUnit:
      args.aantal && args.aantal > 0
        ? Math.round((args.bedragInclBtw / args.aantal) * 100) / 100
        : args.bedragInclBtw,
    vatCode: btwCode(),
    ledgerId: omzetLedger(),
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
  voorstellen: SyncVoorstel[];
  fouten: Array<{ paymentId: string; fout: string }>;
}

// Boekt (of toont, bij dry-run) de betaalde facturen die nog niet in
// e-Boekhouden staan. Standaard dry-run; boekt alleen echt als dry=false
// EN EBOEKHOUDEN_MOOIHUUS_TOKEN is gezet.
export async function syncBetalingen(opts?: { dry?: boolean; limiet?: number }): Promise<SyncResultaat> {
  const dry = opts?.dry !== false;
  const actief = eboekhoudenEnabled();
  const betalingen = getPayments().filter((p) => p.status === "paid" && !p.geboektInEboekhouden);
  const kandidaten = opts?.limiet ? betalingen.slice(0, opts.limiet) : betalingen;

  const voorstellen: SyncVoorstel[] = [];
  const fouten: Array<{ paymentId: string; fout: string }> = [];
  let geboekt = 0;

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
      datum: (p.betaaldOp || p.aangemaakt || "").slice(0, 10),
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
      const factuur = await maakVerkoopfactuur({
        relationId,
        factuurnummer: p.factuurnummer,
        datum: basis.datum || undefined,
        omschrijving: basis.omschrijving,
        bedragInclBtw: p.bedrag,
        aantal: p.aantalObjecten || 1,
      });
      const ebId = factuur?.id || factuur?.invoiceId || "";
      updatePayment(p.id, { geboektInEboekhouden: true, eboekhoudenFactuurId: String(ebId) });
      geboekt++;
      voorstellen.push({ ...basis, actie: "geboekt", eboekhoudenId: ebId });
    } catch (e: any) {
      fouten.push({ paymentId: p.id, fout: String(e?.message || e) });
    }
  }

  return { ok: true, dry, actief, aantalKandidaten: kandidaten.length, geboekt, voorstellen, fouten };
}
