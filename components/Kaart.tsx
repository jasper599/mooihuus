"use client";

import { useEffect, useRef } from "react";
import { Listing } from "@/lib/types";
import { euro } from "@/lib/format";
import { PROVINCIE_CENTROID, scatter } from "@/lib/provincie-geo";

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

      // tel per provincie voor de spreiding
      const perProv: Record<string, number> = {};
      const bounds: [number, number][] = [];

      for (const l of listings) {
        const base = PROVINCIE_CENTROID[l.provincie];
        if (!base) continue;
        const i = perProv[l.provincie] ?? 0;
        perProv[l.provincie] = i + 1;
        const pos = scatter(base, i);
        bounds.push(pos);

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#2f5d41;color:#fff;font:600 11px/1.4 system-ui;padding:3px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3)">${euro(l.prijs)}</div>`,
          iconSize: [0, 0],
          iconAnchor: [20, 12],
        });
        const href = (locale && locale !== "nl" ? `/${locale}` : "") + `/aanbod/${l.id}`;
        const foto = l.fotos && l.fotos[0] ? `<img src="${l.fotos[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px" />` : "";
        L.marker(pos as any, { icon })
          .addTo(map)
          .bindPopup(
            `<a href="${href}" style="text-decoration:none;color:#1c2b22;display:block;width:180px">${foto}<strong style="font:700 13px system-ui">${l.titel}</strong><br><span style="color:#6b7280;font:500 12px system-ui">${l.type} · ${l.provincie}</span><br><span style="color:#c56b1f;font:700 13px system-ui">${euro(l.prijs)}</span></a>`
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
        Woningen staan op provincieniveau geplaatst — klik op een prijs voor de woning.
      </div>
    </div>
  );
}
