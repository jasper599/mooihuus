"use client";

import { useEffect, useRef } from "react";
import { Listing } from "@/lib/types";
import { PROVINCIE_CENTROID, scatter } from "@/lib/provincie-geo";
import { findParkCoord } from "@/lib/park-geo";

// Leaflet wordt alleen in de browser geladen (geen SSR).
export function Kaart({ listings, locale = "nl" }: { listings: Listing[]; locale?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      // Leaflet-stylesheet eenmalig injecteren (voorkomt bundler/SSR-gedoe).
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

      // oude markers weg
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      // Tel per plaatsingspunt (park óf provincie) voor de spreiding, zodat
      // meerdere woningen op hetzelfde park netjes naast elkaar staan.
      const perGroep: Record<string, number> = {};
      const bounds: [number, number][] = [];

      for (const l of listings) {
        const park = findParkCoord(l.park);
        const base = park ? park.coord : PROVINCIE_CENTROID[l.provincie];
        if (!base) continue;
        const groep = park ? `park:${park.plaats}` : `prov:${l.provincie}`;
        const i = perGroep[groep] ?? 0;
        perGroep[groep] = i + 1;
        // Park: kleine spreiding rond het park. Provincie: ruimere spreiding.
        const pos = scatter(base, i, park ? 0.28 : 1);
        bounds.push(pos);

        const icon = L.divIcon({
          className: "",
          html: `<div style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))"><svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5 21.5 11h-2.6v9.5h-4.6v-6h-4.6v6H5.1V11H2.5z" fill="#3f7d55" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 24],
        });
        const href = (locale && locale !== "nl" ? `/${locale}` : "") + `/aanbod/${l.id}`;
        const foto = l.fotos && l.fotos[0] ? `<img src="${l.fotos[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px" />` : "";
        const plaats = park ? `${l.park} · ${park.plaats}` : `${l.type} · ${l.provincie}`;
        L.marker(pos as any, { icon })
          .addTo(map)
          .bindPopup(
            `<a href="${href}" style="text-decoration:none;color:#1c2b22;display:block;width:180px">${foto}<strong style="font:700 13px system-ui">${l.titel}</strong><br><span style="color:#6b7280;font:500 12px system-ui">${plaats}</span></a>`
          );
      }

      if (bounds.length) map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 9 });
      setTimeout(() => map.invalidateSize(), 50);
    })();

    return () => {
      cancelled = true;
    };
  }, [listings, locale]);

  return (
    <div className="rounded-2xl overflow-hidden border border-lijn">
      <div ref={ref} style={{ height: 480, width: "100%" }} />
      <div className="text-xs text-grijs px-3 py-2 bg-creme">
        De groene huisjes staan bij het recreatiepark van de woning (of anders in de juiste provincie) — klik op een huisje voor de woning.
      </div>
    </div>
  );
}
