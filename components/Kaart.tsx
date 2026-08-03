"use client";

import { useEffect, useRef } from "react";
import { Listing } from "@/lib/types";
import { PROVINCIE_CENTROID, scatter } from "@/lib/provincie-geo";
import { findParkCoord } from "@/lib/park-geo";

const HOUSE_SVG =
  `<div style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))"><svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5 21.5 11h-2.6v9.5h-4.6v-6h-4.6v6H5.1V11H2.5z" fill="#3f7d55" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`;

function normPc(pc: string): string {
  return pc.toUpperCase().replace(/\s+/g, "").slice(0, 6);
}

// Geocode een postcode via de officiële PDOK Locatieserver (vanuit de browser).
async function geocodePDOK(pc: string): Promise<[number, number] | null> {
  try {
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(pc)}&rows=1&fl=centroide_ll`;
    const r = await fetch(url);
    const d = await r.json();
    const doc = d?.response?.docs?.[0];
    const m = doc?.centroide_ll?.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!m) return null;
    const lon = parseFloat(m[1]);
    const lat = parseFloat(m[2]);
    if (!(lat >= 50.5 && lat <= 53.8 && lon >= 3.2 && lon <= 7.5)) return null;
    return [lat, lon];
  } catch {
    return null;
  }
}

export function Kaart({ listings, locale = "nl" }: { listings: Listing[]; locale?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !ref.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(ref.current, { scrollWheelZoom: false }).setView([52.2, 5.3], 7);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 18,
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      const icon = L.divIcon({ className: "", html: HOUSE_SVG, iconSize: [26, 26], iconAnchor: [13, 24] });
      const bounds: [number, number][] = [];
      const perGroep: Record<string, number> = {};

      const href = (id: string) => (locale && locale !== "nl" ? `/${locale}` : "") + `/aanbod/${id}`;
      function plaats(l: Listing, base: [number, number], groep: string, spread: number, sub: string) {
        const i = perGroep[groep] ?? 0;
        perGroep[groep] = i + 1;
        const pos = scatter(base, i, spread);
        bounds.push(pos);
        const foto = l.fotos && l.fotos[0] ? `<img src="${l.fotos[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px" />` : "";
        L.marker(pos as any, { icon })
          .addTo(map)
          .bindPopup(
            `<a href="${href(l.id)}" style="text-decoration:none;color:#1c2b22;display:block;width:180px">${foto}<strong style="font:700 13px system-ui">${l.titel}</strong><br><span style="color:#6b7280;font:500 12px system-ui">${sub}</span></a>`
          );
      }

      // Bekende postcode→coördinaten uit de cache ophalen.
      let cache: Record<string, [number, number]> = {};
      try {
        const res = await fetch("/api/postcodegeo");
        cache = (await res.json()).map || {};
      } catch {
        cache = {};
      }
      if (cancelled) return;

      // Postcodes die nog gegeocodeerd moeten worden, gegroepeerd per postcode.
      const teGeocoderen = new Map<string, Listing[]>();

      for (const l of listings) {
        const pc = l.postcode ? normPc(l.postcode) : "";
        if (pc && cache[pc]) {
          plaats(l, cache[pc], `pc:${pc}`, 0.15, `${l.type} · ${l.provincie}`);
          continue;
        }
        if (pc) {
          const arr = teGeocoderen.get(pc) || [];
          arr.push(l);
          teGeocoderen.set(pc, arr);
          continue;
        }
        // Geen postcode → park, anders provincie.
        const park = findParkCoord(l.park);
        if (park) {
          plaats(l, park.coord, `park:${park.plaats}`, 0.28, `${l.park} · ${park.plaats}`);
        } else if (PROVINCIE_CENTROID[l.provincie]) {
          plaats(l, PROVINCIE_CENTROID[l.provincie], `prov:${l.provincie}`, 1, `${l.type} · ${l.provincie}`);
        }
      }

      if (bounds.length) map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 11 });
      setTimeout(() => map.invalidateSize(), 50);

      // Onbekende postcodes één voor één geocoderen (rustig aan voor PDOK).
      for (const [pc, ls] of Array.from(teGeocoderen.entries())) {
        if (cancelled) return;
        const coord = await geocodePDOK(pc);
        if (coord) {
          fetch("/api/postcodegeo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pc, lat: coord[0], lon: coord[1] }),
          }).catch(() => {});
          ls.forEach((l) => plaats(l, coord, `pc:${pc}`, 0.15, `${l.type} · ${l.provincie}`));
        } else {
          // Geocode mislukt → terugval op park/provincie.
          ls.forEach((l) => {
            const park = findParkCoord(l.park);
            if (park) plaats(l, park.coord, `park:${park.plaats}`, 0.28, `${l.park} · ${park.plaats}`);
            else if (PROVINCIE_CENTROID[l.provincie]) plaats(l, PROVINCIE_CENTROID[l.provincie], `prov:${l.provincie}`, 1, `${l.type} · ${l.provincie}`);
          });
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (!cancelled && bounds.length) map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 12 });
    })();

    return () => {
      cancelled = true;
    };
  }, [listings, locale]);

  return (
    <div className="rounded-2xl overflow-hidden border border-lijn">
      <div ref={ref} style={{ height: 480, width: "100%" }} />
      <div className="text-xs text-grijs px-3 py-2 bg-creme">
        Woningen staan op hun postcode (of anders bij het recreatiepark / in de provincie) — klik op een huisje voor de woning.
      </div>
    </div>
  );
}
