import { Listing } from "./types";
import { upsertFeedListing, sweepFeed, dedupliceerExterneWoningen } from "./db";
import { COMPANY } from "./company";
import {
  getAllMediaContracts,
  getSummariesForRealtor,
  getProperty,
  confirmRetrieval,
  kolibriGeconfigureerd,
  arr,
  ml,
  num,
  isTrue,
  stripHtml,
} from "./kolibri";

// ------------------------------------------------------------------
// Generiek feed-importskelet voor makelaars-CRM's (Kolibri, Realworks, …).
// De orchestratie (ophalen → mappen → upserten → verwijderde afvoeren) staat
// hier klaar. Per partner voegen we later een "adapter" toe die hun API leest
// en hun object naar ons Listing-model mapt — dát is het enige dat nog moet
// gebeuren zodra we credentials + XSD/Swagger van de partner hebben.
// ------------------------------------------------------------------

export interface FeedObject {
  externalId: string; // uniek id van het object bij de bron
  data: Partial<Listing>; // gemapte woninggegevens (titel, prijs, fotos, videoUrl, …)
}

export interface FeedAdapter {
  source: string; // "kolibri" | "realworks"
  // Haalt de huidige objecten bij de bron op en levert ze gemapt aan.
  fetchObjects(): Promise<FeedObject[]>;
}

export interface FeedResultaat {
  source: string;
  verwerkt: number;
  offline: number;
}

// Draait één volledige synchronisatie voor een bron.
export async function importFeed(adapter: FeedAdapter): Promise<FeedResultaat> {
  const objects = await adapter.fetchObjects();
  const seen: string[] = [];
  for (const o of objects) {
    upsertFeedListing(adapter.source, o.externalId, o.data);
    seen.push(o.externalId);
  }
  const offline = sweepFeed(adapter.source, seen);
  return { source: adapter.source, verwerkt: objects.length, offline };
}

// --- Kolibri (Wazzup Real Estate Connector) ---------------------------------
// Auto Accept staat aan, dus we accepteren zelf geen contracten. Flow per sync:
//   1. actieve contracten (kantoren) ophalen
//   2. per kantoor de pand-samenvattingen
//   3. per pand het volledige pand ophalen en mappen
//   4. per pand een terugkoppeling geven (confirm, optioneel via KOLIBRI_CONFIRM)

const CONFIRM_AAN = process.env.KOLIBRI_CONFIRM === "1"; // terugkoppeling naar de makelaar (standaard uit tijdens testen)

// PropertyInfo/Status → onze listingstatus.
function kolibriStatus(status: string): Listing["status"] {
  const s = (status || "").toUpperCase();
  if (s === "SOLD" || s === "RENTED") return "verkocht";
  if (s === "WITHDRAWN") return "offline";
  return "live"; // AVAILABLE, SOLD_UNDER_CONDITIONS, RENTED_UNDER_CONDITIONS
}

// Type/PropertyTypes → ons woningtype-label.
function kolibriType(p: any): string {
  const raw = p?.Type?.PropertyTypes?.PropertyType ?? p?.Type?.PropertyTypes ?? p?.Type?.PropertyType;
  const types = arr(raw).map((x: any) => String(typeof x === "object" ? x["#text"] ?? "" : x).toUpperCase());
  const has = (re: RegExp) => types.some((t) => re.test(t));
  if (has(/BUNGALOW/)) return "Bungalow";
  if (has(/VILLA|MANSION|COUNTRY_HOUSE/)) return "Villa";
  if (has(/APARTMENT|PENTHOUSE|MAISONETTE|FLAT|STUDIO/)) return "Appartement";
  if (has(/MOBILE_HOME|HOUSEBOAT/)) return "Chalet";
  if (has(/HOUSE|FARM/)) return "Vakantiehuis";
  return "Recreatiewoning";
}

// Financials → prijs + suffix, met inachtneming van HidePrice.
function kolibriPrijs(p: any, doel: "koop" | "huur", verbergPrijs: boolean): { prijs: number; suffix: string } {
  if (verbergPrijs) return { prijs: 0, suffix: "Prijs op aanvraag" };
  const fin = p?.Financials || {};
  if (doel === "koop") {
    const cond = String(fin.PurchaseCondition ?? "").toUpperCase();
    const suffix = cond === "FREE_ON_NAME" ? "v.o.n." : cond === "COSTS_BUYER" ? "k.k." : "";
    return { prijs: Math.round(num(fin.PurchasePrice)), suffix };
  }
  const per = String(fin.RentPriceType ?? "").toUpperCase();
  const suffix =
    per === "PRICE_PER_MONTH" ? "p.m." :
    per === "PRICE_PER_YEAR" ? "p.j." :
    per === "PRICE_PER_QUARTER" ? "per kwartaal" :
    per === "PRICE_PER_HALF_YEAR" ? "per half jaar" : "";
  return { prijs: Math.round(num(fin.RentPrice)), suffix };
}

const KOLIBRI_ENERGIE: Record<string, string> = {
  APLUSPLUS: "A++", APLUS: "A+", A: "A", B: "B", C: "C", D: "D", E: "E", F: "F", G: "G",
};

// Zet één RealEstateProperty-XML-boom om naar onze Partial<Listing>.
// Retourneert null als het pand overgeslagen moet worden.
function mapKolibriPand(p: any): Partial<Listing> | null {
  const info = p?.PropertyInfo || {};
  if (isTrue(info.TemporaryHideProperty)) return null; // makelaar heeft 'm tijdelijk verborgen

  const verbergPrijs = isTrue(info.HidePrice);
  const verbergAdres = isTrue(info.HideAddress);

  const offer = p?.Offer || {};
  const doel: "koop" | "huur" = isTrue(offer.IsForRent) && !isTrue(offer.IsForSale) ? "huur" : "koop";

  const adres = p?.Location?.Address || {};
  const plaats = ml(adres.CityName);
  const provincie = ml(adres.Region) || ml(adres.SubRegion) || ml(adres.District) || plaats || "Nederland";
  const park = String(p?.Location?.Residence ?? "").trim();

  const { prijs, suffix } = kolibriPrijs(p, doel, verbergPrijs);
  const type = kolibriType(p);
  const titel = ml(p?.Descriptions?.Title) || `${type}${plaats ? " in " + plaats : ""}`;
  const omschrijving = stripHtml(ml(p?.Descriptions?.AdText)).slice(0, 6000);

  // Foto's: alleen Attachments van het type PHOTO, op volgorde (Index), hoofdfoto eerst.
  const fotos = arr(p?.Attachments?.Attachment)
    .map((a: any) => ({
      url: String(a?.URLNormalizedFile || a?.URLOriginalFile || "").trim(),
      type: String(a?.Type ?? "PHOTO").toUpperCase(),
      index: num(a?.Index),
      main: String(a?.SubType ?? "").toUpperCase() === "MAIN_PHOTO",
    }))
    .filter((a) => (a.type === "PHOTO" || a.type === "") && /^https?:\/\//i.test(a.url))
    .sort((a, b) => (a.main === b.main ? a.index - b.index : a.main ? -1 : 1))
    .map((a) => a.url)
    .slice(0, 40);

  const counts = p?.Counts || {};
  const energieKlasse = String(p?.ClimatControl?.EnergyCertificate?.EnergyClass ?? "").toUpperCase();
  const bouwjaar = parseInt(String(p?.Construction?.ConstructionYearFrom ?? ""), 10);

  const data: Partial<Listing> = {
    doel,
    titel: titel || "Recreatiewoning",
    type,
    provincie,
    park,
    personen: Math.round(num(counts.CountOfBeds)) || 2,
    slaapkamers: Math.round(num(counts.CountOfBedrooms)) || undefined,
    m2: Math.round(num(p?.AreaTotals?.LivingArea) || num(p?.AreaTotals?.LivableArea)) || 0,
    prijs: prijs || (verbergPrijs ? 0 : 1),
    prijsSuffix: suffix || undefined,
    omschrijving,
    fotos,
    bouwjaar: isFinite(bouwjaar) && bouwjaar > 1800 ? bouwjaar : undefined,
    energielabel: KOLIBRI_ENERGIE[energieKlasse] || undefined,
    status: kolibriStatus(info.Status),
    bronLabel: "", // eigen makelaarspand — geen affiliate-badge, geen externalUrl
  };
  if (!verbergAdres) data.postcode = String(adres.PostalCode ?? "").trim() || undefined;
  return data;
}

export const kolibriAdapter: FeedAdapter = {
  source: "kolibri",
  async fetchObjects(): Promise<FeedObject[]> {
    if (!kolibriGeconfigureerd()) {
      throw new Error("KOLIBRI_TOKEN ontbreekt — zet het mediapartner-token als omgevingsvariabele.");
    }
    const contracten = await getAllMediaContracts();
    const actief = contracten.filter((c) => c.MediaContractStatus.toUpperCase() === "ACTIVE");

    const objecten: FeedObject[] = [];
    for (const c of actief) {
      const summaries = await getSummariesForRealtor(c.RealtorID);
      for (const s of summaries) {
        let pand: any;
        try {
          pand = await getProperty(c.RealtorID, s.RealEstateProperyID);
        } catch {
          continue; // één kapot pand mag de rest niet blokkeren
        }
        const data = mapKolibriPand(pand);
        if (!data) continue;
        const externalId = `${c.RealtorID}-${s.RealEstateProperyID}`;
        data.makelaar = c.Name || undefined;
        data.realtorId = String(c.RealtorID);
        objecten.push({ externalId, data });

        // Terugkoppeling aan de makelaar (best-effort; standaard uit tijdens testen).
        if (CONFIRM_AAN) {
          const listingId = `kolibri-${externalId}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 90);
          try {
            await confirmRetrieval(
              c.RealtorID,
              s.RealEstateProperyID,
              `${COMPANY.website}/aanbod/${listingId}`,
              "Uw woning staat op Mooihuus.nl."
            );
          } catch {
            /* terugkoppeling niet gelukt — geen ramp, volgende sync probeert opnieuw */
          }
        }
      }
    }
    return objecten;
  },
};

// Volledige Kolibri-synchronisatie (voor de geplande taak en de beheer-knop).
export async function syncKolibri(): Promise<FeedResultaat> {
  const res = await importFeed(kolibriAdapter);
  dedupliceerExterneWoningen();
  return res;
}

export const realworksAdapter: FeedAdapter = {
  source: "realworks",
  async fetchObjects(): Promise<FeedObject[]> {
    throw new Error(
      "Realworks-koppeling nog niet geconfigureerd. Nodig: API-credentials + veld-mapping. Zodra dat er is, vullen we fetchObjects in."
    );
  },
};

export function adapterVoor(bron: string): FeedAdapter {
  return bron === "realworks" ? realworksAdapter : kolibriAdapter;
}
