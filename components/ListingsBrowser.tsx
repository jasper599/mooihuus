"use client";

import { useMemo, useState } from "react";
import { Listing } from "@/lib/types";
import { Locale, t } from "@/lib/i18n";
import { ListingCard } from "./ListingCard";

const PRIJS_RANGES: { label: string; min: number; max: number }[] = [
  { label: "tot € 100.000", min: 0, max: 100000 },
  { label: "€ 100.000 – € 200.000", min: 100000, max: 200000 },
  { label: "€ 200.000 – € 400.000", min: 200000, max: 400000 },
  { label: "€ 400.000+", min: 400000, max: Infinity },
];

export function ListingsBrowser({ listings, locale = "nl" }: { listings: Listing[]; locale?: Locale }) {
  const [q, setQ] = useState("");
  const [doel, setDoel] = useState("");
  const [provincie, setProvincie] = useState("");
  const [prijs, setPrijs] = useState("");
  const [sort, setSort] = useState("");

  const provincies = useMemo(
    () => Array.from(new Set(listings.map((l) => l.provincie))).sort((a, b) => a.localeCompare(b)),
    [listings]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const range = prijs ? PRIJS_RANGES[Number(prijs)] : null;
    return listings.filter((l) => {
      if (doel && l.doel !== doel) return false;
      if (provincie && l.provincie !== provincie) return false;
      if (range && !(l.prijs >= range.min && l.prijs < range.max)) return false;
      if (term) {
        const hay = `${l.titel} ${l.park} ${l.provincie} ${l.type}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [listings, q, doel, provincie, prijs]);

  const sorted = useMemo(() => {
    if (sort === "prijs-op") return [...filtered].sort((a, b) => a.prijs - b.prijs);
    if (sort === "prijs-af") return [...filtered].sort((a, b) => b.prijs - a.prijs);
    return filtered; // standaard: volgorde uit db (uitgelicht eerst)
  }, [filtered, sort]);

  return (
    <div>
      <div id="aanbod" className="flex gap-2 flex-wrap mt-8 mb-2">
        <input
          className="field flex-1 min-w-[160px]"
          placeholder={t(locale, "home.search")}
          aria-label={t(locale, "home.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="field w-auto" aria-label={t(locale, "home.koopHuur")} value={doel} onChange={(e) => setDoel(e.target.value)}>
          <option value="">{t(locale, "home.koopHuur")}</option>
          <option value="koop">{t(locale, "home.koop")}</option>
          <option value="huur">{t(locale, "home.huur")}</option>
        </select>
        <select className="field w-auto" aria-label={t(locale, "home.alleProv")} value={provincie} onChange={(e) => setProvincie(e.target.value)}>
          <option value="">{t(locale, "home.alleProv")}</option>
          {provincies.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="field w-auto" aria-label={t(locale, "home.allePrijzen")} value={prijs} onChange={(e) => setPrijs(e.target.value)}>
          <option value="">{t(locale, "home.allePrijzen")}</option>
          {PRIJS_RANGES.map((r, i) => (
            <option key={i} value={i}>{r.label}</option>
          ))}
        </select>
        <select className="field w-auto" aria-label={t(locale, "home.sortStandaard")} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">{t(locale, "home.sortStandaard")}</option>
          <option value="prijs-op">{t(locale, "home.sortPrijsOp")}</option>
          <option value="prijs-af">{t(locale, "home.sortPrijsAf")}</option>
        </select>
      </div>

      <div className="text-sm text-grijs mb-4">{sorted.length} {t(locale, "home.resultaten")}</div>

      {sorted.length === 0 ? (
        <div className="card text-grijs">{t(locale, "home.geen")}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((l) => (
            <ListingCard key={l.id} listing={l} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
