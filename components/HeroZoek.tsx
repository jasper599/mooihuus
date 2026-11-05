"use client";

import { useState } from "react";

// Zoekvak bovenaan de homepage. Mooihuus: naar het aanbod (#aanbod) of bij
// "Huren" naar de huurpagina. Woonhuus: plaats of postcode met straal, naar de
// zoekresultaten op /te-koop.
export function HeroZoek({
  site,
  labels,
}: {
  site: "mooihuus" | "woonhuus";
  labels: { waar: string; placeholder: string; ikWil?: string; kopen?: string; huren?: string; maxPrijs?: string; geenMax?: string; zoeken: string; prefix?: string };
}) {
  const [q, setQ] = useState("");
  const [doel, setDoel] = useState<"koop" | "huur">("koop");
  const [prijs, setPrijs] = useState("");
  function zoek(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (site === "woonhuus" && prijs && prijs !== "0") p.set("straal", prijs);
    const qs = p.toString() ? `?${p.toString()}` : "";
    const basis = labels.prefix || "";
    window.location.href =
      site === "woonhuus" ? `/te-koop${qs}` : doel === "huur" ? `${basis}/verhuur${qs}` : `${basis || ""}/${qs}#aanbod`;
  }
  return (
    <form onSubmit={zoek} className="flex flex-wrap gap-2.5 bg-white p-2.5 rounded-2xl border border-lijn" role="search">
      <label className="flex-[1_1_220px] flex flex-col gap-0.5 px-2.5 py-1.5 text-xs font-semibold text-grijs">
        {labels.waar}
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.placeholder}
          className="border-0 text-base font-sans outline-none text-inkt py-1 bg-transparent"
        />
      </label>
      {site === "mooihuus" ? (
        <label className="flex-[0_1_150px] flex flex-col gap-0.5 px-2.5 py-1.5 text-xs font-semibold text-grijs">
          {labels.ikWil}
          <select value={doel} onChange={(e) => setDoel(e.target.value as "koop" | "huur")} className="border-0 text-base font-sans bg-transparent py-1 text-inkt">
            <option value="koop">{labels.kopen}</option>
            <option value="huur">{labels.huren}</option>
          </select>
        </label>
      ) : (
        <label className="flex-[0_1_170px] flex flex-col gap-0.5 px-2.5 py-1.5 text-xs font-semibold text-grijs">
          {labels.maxPrijs}
          <select value={prijs} onChange={(e) => setPrijs(e.target.value)} className="border-0 text-base font-sans bg-transparent py-1 text-inkt">
            {[0, 1, 2, 5, 10, 15, 30, 50].map((km) => (
              <option key={km} value={String(km)}>+ {km} km</option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" className="btn flex-[0_0_auto] min-h-[52px] px-6 text-base">{labels.zoeken}</button>
    </form>
  );
}
