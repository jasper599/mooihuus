import { Listing } from "./types";
import { upsertFeedListing, sweepFeed } from "./db";

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

// --- Stub-adapters — klaar om in te vullen zodra de koppeling geregeld is. ---
// Zodra we de API-toegang + veld-mapping hebben, implementeren we fetchObjects:
//   1. contracten ophalen  2. objectlijst  3. volledige data van gewijzigde objecten
//   4. hun velden mappen naar Partial<Listing> (adres→provincie/park, prijs, m2,
//      personen, bouwjaar, energielabel, fotos[], videoUrl, ...).
export const kolibriAdapter: FeedAdapter = {
  source: "kolibri",
  async fetchObjects(): Promise<FeedObject[]> {
    throw new Error(
      "Kolibri-koppeling nog niet geconfigureerd. Nodig: mediapartner-credentials + toegang tot de Swagger/XSD, en de veld-mapping. Zodra dat er is, vullen we fetchObjects in."
    );
  },
};

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
