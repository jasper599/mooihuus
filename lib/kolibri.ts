import { XMLParser } from "fast-xml-parser";

// ------------------------------------------------------------------
// Client voor de Wazzup/Kolibri Real Estate Connector (WREC), versie 16.0.
// Media Partner "Mooihuus". Alle data komt als XML; het token zit in de URL.
//
// Drie webservices (basis: https://api.wazzupsoftware.com/):
//   ActivateService.svc     → contracten (makelaarskantoren) ophalen/beheren
//   OutputService.svc       → panden ophalen + terugkoppeling (confirm/reject)
//   InformationService.svc  → XSD-schema's (niet nodig voor de import)
//
// Config via env:
//   KOLIBRI_TOKEN          (verplicht) mediapartner-token
//   KOLIBRI_CONNECTOR_URL  (optioneel) default https://api.wazzupsoftware.com/
//   KOLIBRI_VERSION        (optioneel) default 16/0
//
// Auto Accept staat bij ons aan, dus contract-verzoeken accepteren we niet zelf
// (dat doet de Connector automatisch). We halen alleen de actieve contracten +
// hun panden op, en geven per pand een terugkoppeling.
// ------------------------------------------------------------------

const BASE = (process.env.KOLIBRI_CONNECTOR_URL || "https://api.wazzupsoftware.com/").replace(/\/*$/, "/");
const VERSION = process.env.KOLIBRI_VERSION || "16/0";

export function kolibriGeconfigureerd(): boolean {
  return !!process.env.KOLIBRI_TOKEN;
}

function token(): string {
  const t = process.env.KOLIBRI_TOKEN;
  if (!t) throw new Error("KOLIBRI_TOKEN ontbreekt — Kolibri-koppeling niet geconfigureerd.");
  return t;
}

// Elementen die herhaald kunnen voorkomen en die we dus altijd als array willen.
const ARRAY_TAGS = new Set([
  "MediaContractSnapshot",
  "RealEstatePropertySummarySnapshot",
  "Attachment",
  "Translation",
  "PropertyType",
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: true,
  isArray: (name) => ARRAY_TAGS.has(name),
});

// Wikkelt undefined/één-object/array altijd tot een array.
export function arr<T = any>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

export function isTrue(v: any): boolean {
  return v === true || String(v).toLowerCase() === "true";
}

export function num(v: any): number {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isFinite(x) ? x : 0;
}

// Haalt de Nederlandse (of eerste) tekst uit een MultilanguageStringType-node:
//   <Field><Translation language="nl-NL" encoding="HTML">tekst</Translation>…</Field>
export function ml(node: any, lang = "nl-NL"): string {
  if (node === undefined || node === null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  const trs = arr(node.Translation ?? node);
  if (!trs.length) return "";
  const taal = (t: any) => String(t?.["@_language"] ?? t?.["@_Language"] ?? "").toLowerCase();
  const pick = trs.find((t: any) => taal(t) === lang.toLowerCase()) || trs[0];
  if (pick === undefined || pick === null) return "";
  if (typeof pick === "object") return String(pick["#text"] ?? "");
  return String(pick);
}

export function stripHtml(s: string): string {
  return (s || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function haalXml(url: string, method: "GET" | "POST" = "GET"): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: { "user-agent": "MooihuusWREC/1.0", accept: "application/xml,text/xml,*/*" },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`WREC HTTP ${res.status}: ${text.slice(0, 200)}`);
    const doc = parser.parse(text);
    // Het enige root-object is het *Result-object (bv. MediaContractSnapshotResult).
    const rootKey = Object.keys(doc).find((k) => k !== "?xml");
    const result = rootKey ? doc[rootKey] : doc;
    if (result && typeof result === "object" && "IsSuccess" in result && !isTrue(result.IsSuccess)) {
      throw new Error(`WREC-fout: ${result.ErrorMessage || "onbekende fout"}`);
    }
    return result;
  } finally {
    clearTimeout(t);
  }
}

function actUrl(resource: string, query: string): string {
  return `${BASE}ActivateService.svc/${VERSION}/${token()}/${resource}/${query}`;
}
function outUrl(resource: string, query: string): string {
  return `${BASE}OutputService.svc/${VERSION}/${token()}/${resource}/${query}`;
}
function enc(s: string): string {
  return encodeURIComponent(s || "");
}

export interface MediaContract {
  MediaContractID: number;
  RealtorID: number;
  Name: string;
  MediaContractStatus: string; // ACTIVE, SUSPENDED, ...
}

// Stap 1: alle contracten (makelaarskantoren) ophalen.
export async function getAllMediaContracts(): Promise<MediaContract[]> {
  const r = await haalXml(actUrl("mediacontract", "?state="));
  const list = r?.ArrayOfMediaContractSnapshot?.MediaContractSnapshot ?? r?.MediaContractSnapshot;
  return arr(list).map((c: any) => ({
    MediaContractID: num(c.MediaContractID),
    RealtorID: num(c.RealtorID),
    Name: String(c.Name ?? ""),
    MediaContractStatus: String(c.MediaContractStatus ?? ""),
  }));
}

export interface PropertySummary {
  RealEstateProperyID: number; // let op: de API zelf spelt "Propery" (bewust overgenomen)
  RealtorID: number;
  ModificationDateTimeUtc: string;
  AddressSummary: string;
  RealEstateProperyStatus: string;
}

// Stap 2: pand-samenvattingen per makelaar (voor wijzigingsdetectie).
export async function getSummariesForRealtor(realtorID: number): Promise<PropertySummary[]> {
  const r = await haalXml(outUrl("realestatesummary", `?realtorid=${realtorID}`));
  const list =
    r?.ArrayOfRealEstatePropertySummarySnapshot?.RealEstatePropertySummarySnapshot ??
    r?.RealEstatePropertySummarySnapshot;
  return arr(list).map((s: any) => ({
    RealEstateProperyID: num(s.RealEstateProperyID),
    RealtorID: num(s.RealtorID) || realtorID,
    ModificationDateTimeUtc: String(s.ModificationDateTimeUtc ?? ""),
    AddressSummary: String(s.AddressSummary ?? ""),
    RealEstateProperyStatus: String(s.RealEstateProperyStatus ?? ""),
  }));
}

// Stap 3: het volledige pand (rauwe, geparste XML-boom volgens RealEstateProperty.xsd).
export async function getProperty(realtorID: number, propertyID: number): Promise<any> {
  const r = await haalXml(outUrl("realestate", `?realtorid=${realtorID}&id=${propertyID}`));
  return r?.RealEstateProperty ?? r;
}

// Stap 4a: bevestig aan de makelaar dat we het pand hebben verwerkt (met onze
// portal-link naar de detailpagina). Best-effort — nooit de import laten falen.
export async function confirmRetrieval(
  realtorID: number,
  propertyID: number,
  url: string,
  message: string
): Promise<void> {
  await haalXml(
    outUrl("realestate", `?realtorid=${realtorID}&id=${propertyID}&action=confirm&url=${enc(url)}&message=${enc(message)}`),
    "POST"
  );
}

// Stap 4b: weiger een pand met een reden (bv. geen foto's).
export async function rejectRetrieval(realtorID: number, propertyID: number, message: string): Promise<void> {
  await haalXml(
    outUrl("realestate", `?realtorid=${realtorID}&id=${propertyID}&action=reject&message=${enc(message)}`),
    "POST"
  );
}
