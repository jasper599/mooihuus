"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Listing } from "@/lib/types";
import { Locale, t } from "@/lib/i18n";
import { ListingCard } from "./ListingCard";

const Kaart = dynamic(() => import("./Kaart").then((m) => m.Kaart), {
  ssr: false,
  loading: () => <div className="card text-grijs">Kaart laden…</div>,
});

type Range = { label: string; min: number; max: number };

const PRIJS_KOOP: Range[] = [
  { label: "tot € 100.000", min: 0, max: 100000 },
  { label: "€ 100.000 – € 200.000", min: 100000, max: 200000 },
  { label: "€ 200.000 – € 400.000", min: 200000, max: 400000 },
  { label: "€ 400.000+", min: 400000, max: Infinity },
];
const PRIJS_HUUR: Range[] = [
  { label: "tot € 75 p.n.", min: 0, max: 75 },
  { label: "€ 75 – € 125 p.n.", min: 75, max: 125 },
  { label: "€ 125 – € 200 p.n.", min: 125, max: 200 },
  { label: "€ 200+ p.n.", min: 200, max: Infinity },
];
const M2_RANGES: Range[] = [
  { label: "tot 50 m²", min: 0, max: 50 },
  { label: "50 – 75 m²", min: 50, max: 75 },
  { label: "75 – 100 m²", min: 75, max: 100 },
  { label: "100+ m²", min: 100, max: Infinity },
];
const PERSONEN_OPTS = [2, 4, 6, 8, 10];

const PER_PAGINA = 48;

export function ListingsBrowser({
  listings,
  locale = "nl",
  modus = "koop",
}: {
  listings: Listing[];
  locale?: Locale;
  modus?: "koop" | "huur";
}) {
  const huur = modus === "huur";
  const PRIJS_RANGES = huur ? PRIJS_HUUR : PRIJS_KOOP;

  const [q, setQ] = useState("");
  const [provincie, setProvincie] = useState("");
  const [type, setType] = useState("");
  const [personen, setPersonen] = useState("");
  const [prijs, setPrijs] = useState("");
  const [m2, setM2] = useState("");
  const [sort, setSort] = useState("");
  const [view, setView] = useState<"lijst" | "kaart">("lijst");
  const [pagina, setPagina] = useState(0);
  // Bij een nieuwe filter/zoekopdracht terug naar de eerste pagina.
  useEffect(() => setPagina(0), [q, provincie, type, personen, prijs, m2, sort]);

  const provincies = useMemo(
    () => Array.from(new Set(listings.map((l) => l.provincie).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [listings]
  );
  const types = useMemo(
    () => Array.from(new Set(listings.map((l) => l.type).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [listings]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const range = prijs ? PRIJS_RANGES[Number(prijs)] : null;
    const opp = m2 ? M2_RANGES[Number(m2)] : null;
    const minPers = personen ? Number(personen) : 0;
    return listings.filter((l) => {
      if (provincie && l.provincie !== provincie) return false;
      if (type && l.type !== type) return false;
      if (minPers && (l.personen || 0) < minPers) return false;
      if (range && !(l.prijs >= range.min && l.prijs < range.max)) return false;
      if (opp && !((l.m2 || 0) >= opp.min && (l.m2 || 0) < opp.max)) return false;
      if (term) {
        const hay = `${l.titel} ${l.park} ${l.provincie} ${l.type}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [listings, q, provincie, type, personen, prijs, m2, PRIJS_RANGES]);

  const sorted = useMemo(() => {
    if (sort === "prijs-op") return [...filtered].sort((a, b) => a.prijs - b.prijs);
    if (sort === "prijs-af") return [...filtered].sort((a, b) => b.prijs - a.prijs);
    return filtered; // standaard: volgorde uit db (uitgelicht eerst)
  }, [filtered, sort]);

  // Paginering: rendert nooit meer dan PER_PAGINA kaarten tegelijk, zodat de
  // pagina licht blijft — ook met duizenden woningen in het aanbod.
  const totaalPaginas = Math.max(1, Math.ceil(sorted.length / PER_PAGINA));
  const huidige = Math.min(pagina, totaalPaginas - 1);
  const zichtbaar = sorted.slice(huidige * PER_PAGINA, (huidige + 1) * PER_PAGINA);
  // De kaart nooit met duizenden markers belasten.
  const kaartLijst = sorted.slice(0, 500);

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
        <select className="field w-auto" aria-label={t(locale, "home.alleProv")} value={provincie} onChange={(e) => setProvincie(e.target.value)}>
          <option value="">{t(locale, "home.alleProv")}</option>
          {provincies.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="field w-auto" aria-label="Type woning" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Alle types</option>
          {types.map((tp) => (
            <option key={tp} value={tp}>{tp}</option>
          ))}
        </select>
        <select className="field w-auto" aria-label="Aantal personen" value={personen} onChange={(e) => setPersonen(e.target.value)}>
          <option value="">Alle groottes</option>
          {PERSONEN_OPTS.map((n) => (
            <option key={n} value={n}>vanaf {n} pers.</option>
          ))}
        </select>
        <select className="field w-auto" aria-label={t(locale, "home.allePrijzen")} value={prijs} onChange={(e) => setPrijs(e.target.value)}>
          <option value="">{huur ? "Alle prijzen p.n." : t(locale, "home.allePrijzen")}</option>
          {PRIJS_RANGES.map((r, i) => (
            <option key={i} value={i}>{r.label}</option>
          ))}
        </select>
        {!huur && (
          <select className="field w-auto" aria-label="Woonoppervlak" value={m2} onChange={(e) => setM2(e.target.value)}>
            <option value="">Alle oppervlaktes</option>
            {M2_RANGES.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>
        )}
        <select className="field w-auto" aria-label={t(locale, "home.sortStandaard")} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">{t(locale, "home.sortStandaard")}</option>
          <option value="prijs-op">{t(locale, "home.sortPrijsOp")}</option>
          <option value="prijs-af">{t(locale, "home.sortPrijsAf")}</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="text-sm text-grijs">{sorted.length} {t(locale, "home.resultaten")}</div>
        <div className="inline-flex rounded-full border border-lijn overflow-hidden text-sm font-display font-semibold">
          <button
            type="button"
            onClick={() => setView("lijst")}
            className={`px-3 py-1.5 ${view === "lijst" ? "bg-bosgroen text-white" : "text-bosgroen-dk hover:bg-zand"}`}
          >
            ☰ Lijst
          </button>
          <button
            type="button"
            onClick={() => setView("kaart")}
            className={`px-3 py-1.5 ${view === "kaart" ? "bg-bosgroen text-white" : "text-bosgroen-dk hover:bg-zand"}`}
          >
            🗺️ Kaart
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="card text-grijs">{t(locale, "home.geen")}</div>
      ) : view === "kaart" ? (
        <Kaart listings={kaartLijst} locale={locale} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zichtbaar.map((l) => (
              <ListingCard key={l.id} listing={l} locale={locale} />
            ))}
          </div>
          {totaalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                type="button"
                onClick={() => setPagina(Math.max(0, huidige - 1))}
                disabled={huidige === 0}
                className="btn btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Vorige
              </button>
              <span className="text-sm text-grijs font-display font-semibold">
                Pagina {huidige + 1} van {totaalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina(Math.min(totaalPaginas - 1, huidige + 1))}
                disabled={huidige >= totaalPaginas - 1}
                className="btn btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Volgende →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
