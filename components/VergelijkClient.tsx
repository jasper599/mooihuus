"use client";

import Link from "next/link";
import { Listing } from "@/lib/types";
import { euro, prijsSuffix, grondInfo } from "@/lib/format";
import { useFavorites } from "./useFavorites";

const RIJEN: { label: string; get: (l: Listing) => string }[] = [
  { label: "Prijs", get: (l) => `${euro(l.prijs)}${prijsSuffix(l) ? " " + prijsSuffix(l) : ""}` },
  { label: "Type", get: (l) => l.type },
  { label: "Provincie", get: (l) => l.provincie },
  { label: "Park", get: (l) => l.park || "—" },
  { label: "Oppervlakte", get: (l) => `${l.m2} m²` },
  { label: "Personen", get: (l) => String(l.personen) },
  { label: "Slaapkamers", get: (l) => (l.slaapkamers ? String(l.slaapkamers) : "—") },
  { label: "Bouwjaar", get: (l) => (l.bouwjaar ? String(l.bouwjaar) : "—") },
  { label: "Perceel", get: (l) => (l.perceel ? `${l.perceel} m²` : "—") },
  { label: "Grond", get: (l) => grondInfo(l.grond)?.label || "—" },
  { label: "Energielabel", get: (l) => l.energielabel || "—" },
];

export function VergelijkClient({ listings }: { listings: Listing[] }) {
  const { favs, toggle } = useFavorites();
  const mijn = listings.filter((l) => favs.includes(l.id));

  if (mijn.length === 0) {
    return (
      <div className="card text-grijs">
        Je hebt nog geen woningen bewaard om te vergelijken. Tik op het hartje 🤍 bij een woning.
        <div className="mt-3"><Link href="/" className="btn btn-green text-sm">Bekijk het aanbod</Link></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse min-w-full">
        <thead>
          <tr>
            <th className="sticky left-0 bg-creme z-10 p-2 text-left align-bottom"></th>
            {mijn.map((l) => (
              <th key={l.id} className="p-2 align-top min-w-[160px] text-left">
                <div className="h-24 rounded-lg overflow-hidden bg-salie-lt mb-1">
                  {l.fotos && l.fotos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.fotos[0]} alt={l.titel} className="w-full h-full object-cover" />
                  )}
                </div>
                <Link href={`/aanbod/${l.id}`} className="font-display font-bold text-bosgroen-dk text-sm hover:underline block">{l.titel}</Link>
                <button onClick={() => toggle(l.id)} className="text-xs text-oranje-dk hover:underline mt-0.5">verwijderen</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RIJEN.map((r, i) => (
            <tr key={r.label} className={i % 2 ? "bg-creme" : ""}>
              <td className="sticky left-0 z-10 p-2 text-sm text-grijs font-semibold whitespace-nowrap" style={{ background: i % 2 ? "#FBF8F1" : "#fff" }}>{r.label}</td>
              {mijn.map((l) => (
                <td key={l.id} className="p-2 text-sm font-semibold text-inkt">{r.get(l)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
