"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Listing } from "@/lib/types";
import { ListingCard } from "./ListingCard";
import { MOOIHUUS_URL } from "@/lib/site";

// Zoeken op Woonhuus.nl: één zoekvak met straal, links de filters en rechts de
// resultaten (lijst of kaart). Werkt zoals men het van de grote woningsites
// gewend is: plaats of postcode, straal, prijs van/tot, oppervlakte,
// slaapkamers, soort woning, energielabel, bouwperiode en aangeboden sinds.

const Kaart = dynamic(() => import("./Kaart").then((m) => m.Kaart), {
  ssr: false,
  loading: () => <div className="card text-grijs">Kaart laden…</div>,
});

const PER_PAGINA = 24;
const STRALEN = [0, 1, 2, 5, 10, 15, 30, 50];
const PRIJZEN = [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 600000, 700000, 800000, 1000000, 1500000, 2000000];
const OPPERVLAKTES = [50, 75, 100, 125, 150, 200, 250];
const PERCELEN = [100, 250, 500, 1000, 2500];
const SLAAPKAMERS = [1, 2, 3, 4, 5];
const LABELS = ["A", "B", "C", "D", "E", "F", "G"];
const SINDS = [
  { v: "", l: "Geen voorkeur" },
  { v: "1", l: "Vandaag" },
  { v: "3", l: "3 dagen" },
  { v: "5", l: "5 dagen" },
  { v: "10", l: "10 dagen" },
  { v: "30", l: "30 dagen" },
];
const BOUWPERIODES = [
  { v: "-1906", l: "Voor 1906", min: 0, max: 1905 },
  { v: "1906-1930", l: "1906 - 1930", min: 1906, max: 1930 },
  { v: "1931-1944", l: "1931 - 1944", min: 1931, max: 1944 },
  { v: "1945-1959", l: "1945 - 1959", min: 1945, max: 1959 },
  { v: "1960-1970", l: "1960 - 1970", min: 1960, max: 1970 },
  { v: "1971-1980", l: "1971 - 1980", min: 1971, max: 1980 },
  { v: "1981-1990", l: "1981 - 1990", min: 1981, max: 1990 },
  { v: "1991-2000", l: "1991 - 2000", min: 1991, max: 2000 },
  { v: "2001-2010", l: "2001 - 2010", min: 2001, max: 2010 },
  { v: "2011-2020", l: "2011 - 2020", min: 2011, max: 2020 },
  { v: "2021-", l: "Na 2020", min: 2021, max: 9999 },
];

const euro = (n: number) => `€ ${n.toLocaleString("nl-NL")}`;

// Appartement of woonhuis, afgeleid uit het woningtype.
function soortVan(type: string): "woonhuis" | "appartement" {
  return /appartement|flat|portiek|galerij|bovenwoning|benedenwoning|penthouse|maisonnette|studio/i.test(type || "")
    ? "appartement"
    : "woonhuis";
}

function afstandKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Plaats, postcode of adres omzetten naar coördinaten (PDOK Locatieserver).
async function geocode(q: string): Promise<[number, number] | null> {
  try {
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(q)}&rows=1&fl=centroide_ll&fq=type:(woonplaats OR postcode OR adres OR gemeente OR weg)`;
    const d = await (await fetch(url)).json();
    const m = d?.response?.docs?.[0]?.centroide_ll?.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!m) return null;
    return [parseFloat(m[2]), parseFloat(m[1])];
  } catch {
    return null;
  }
}

const normPc = (pc?: string) => (pc || "").toUpperCase().replace(/\s+/g, "").slice(0, 6);

function Groep({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-lijn last:border-0">
      <div className="font-display font-bold text-bosgroen-dk mb-2">{titel}</div>
      {children}
    </div>
  );
}

function Keuze({ checked, onChange, label, aantal }: { checked: boolean; onChange: (v: boolean) => void; label: string; aantal?: number }) {
  return (
    <label className="flex items-center gap-2 py-1 text-sm text-inkt cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#1E3A5F]" />
      <span className="flex-1">{label}</span>
      {aantal !== undefined && <span className="text-grijs text-xs">{aantal}</span>}
    </label>
  );
}

export function WoonhuusZoeker({
  listings,
  geo,
  initialQ = "",
  initialStraal = 0,
  vasteProvincie,
}: {
  listings: Listing[];
  geo: Record<string, [number, number]>; // postcode -> [lat, lon]
  initialQ?: string;
  initialStraal?: number;
  vasteProvincie?: string; // op een provinciepagina
}) {
  const [invoer, setInvoer] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [straal, setStraal] = useState(initialStraal);
  const [punt, setPunt] = useState<[number, number] | null>(null);
  const [prijsVan, setPrijsVan] = useState(0);
  const [prijsTot, setPrijsTot] = useState(0);
  const [oppVan, setOppVan] = useState(0);
  const [oppTot, setOppTot] = useState(0);
  const [perceelVan, setPerceelVan] = useState(0);
  const [slaapkamers, setSlaapkamers] = useState(0);
  const [soorten, setSoorten] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [bouw, setBouw] = useState<string[]>([]);
  const [sinds, setSinds] = useState("");
  const [openHuis, setOpenHuis] = useState(false);
  const [sort, setSort] = useState("");
  const [view, setView] = useState<"lijst" | "kaart">("lijst");
  const [pagina, setPagina] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Coördinaten van woningpostcodes die nog niet in de cache stonden.
  const [extraGeo, setExtraGeo] = useState<Record<string, [number, number]>>({});
  const geoAlles = useMemo(() => ({ ...geo, ...extraGeo }), [geo, extraGeo]);

  // Zoekterm omzetten naar een punt, alleen als er een straal is gekozen.
  useEffect(() => {
    let weg = false;
    if (!q.trim() || !straal) {
      setPunt(null);
      return;
    }
    geocode(q.trim()).then((p) => !weg && setPunt(p));
    return () => {
      weg = true;
    };
  }, [q, straal]);

  // Bij zoeken met straal: ontbrekende woningpostcodes opzoeken en bewaren.
  useEffect(() => {
    if (!straal || !punt) return;
    let weg = false;
    const missend = Array.from(new Set(listings.map((l) => normPc(l.postcode)).filter((pc) => pc.length >= 4 && !geoAlles[pc]))).slice(0, 40);
    (async () => {
      for (const pc of missend) {
        if (weg) return;
        const c = await geocode(pc);
        if (!c || weg) continue;
        setExtraGeo((g) => ({ ...g, [pc]: c }));
        fetch("/api/postcodegeo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pc, lat: c[0], lon: c[1] }) }).catch(() => {});
      }
    })();
    return () => {
      weg = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [straal, punt, listings]);

  useEffect(() => setPagina(0), [q, straal, punt, prijsVan, prijsTot, oppVan, oppTot, perceelVan, slaapkamers, soorten, types, labels, bouw, sinds, openHuis, sort]);

  const alleTypes = useMemo(
    () => Array.from(new Set(listings.map((l) => l.type).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [listings]
  );

  const vandaag = new Date().toISOString().slice(0, 10);

  const gefilterd = useMemo(() => {
    const term = q.trim().toLowerCase();
    const termPc = normPc(term);
    return listings.filter((l) => {
      if (vasteProvincie && l.provincie !== vasteProvincie) return false;
      if (term) {
        const tekst = `${l.titel} ${l.provincie} ${l.postcode ?? ""} ${l.park} ${l.makelaar ?? ""}`.toLowerCase();
        const tekstMatch = tekst.includes(term) || (termPc.length >= 4 && normPc(l.postcode).startsWith(termPc));
        if (straal && punt) {
          const c = geoAlles[normPc(l.postcode)];
          const binnen = c ? afstandKm(punt, c) <= straal : false;
          if (!binnen && !tekstMatch) return false;
        } else if (!tekstMatch) return false;
      }
      if (prijsVan && l.prijs < prijsVan) return false;
      if (prijsTot && l.prijs > prijsTot) return false;
      if (oppVan && (l.m2 || 0) < oppVan) return false;
      if (oppTot && (l.m2 || 0) > oppTot) return false;
      if (perceelVan && (l.perceel || 0) < perceelVan) return false;
      if (slaapkamers && (l.slaapkamers || 0) < slaapkamers) return false;
      if (soorten.length && !soorten.includes(soortVan(l.type))) return false;
      if (types.length && !types.includes(l.type)) return false;
      if (labels.length && !labels.includes((l.energielabel || "").trim().charAt(0).toUpperCase())) return false;
      if (bouw.length) {
        const j = l.bouwjaar || 0;
        if (!j || !BOUWPERIODES.some((b) => bouw.includes(b.v) && j >= b.min && j <= b.max)) return false;
      }
      if (sinds) {
        const grens = Date.now() - Number(sinds) * 86400000;
        if (!l.aangemaakt || new Date(l.aangemaakt).getTime() < grens) return false;
      }
      if (openHuis && !(l.openhuisDatum && l.openhuisDatum >= vandaag)) return false;
      return true;
    });
  }, [listings, vasteProvincie, q, straal, punt, geoAlles, prijsVan, prijsTot, oppVan, oppTot, perceelVan, slaapkamers, soorten, types, labels, bouw, sinds, openHuis, vandaag]);

  const gesorteerd = useMemo(() => {
    const r = [...gefilterd];
    if (sort === "nieuw") r.sort((a, b) => (b.aangemaakt || "").localeCompare(a.aangemaakt || ""));
    if (sort === "prijs-op") r.sort((a, b) => a.prijs - b.prijs);
    if (sort === "prijs-af") r.sort((a, b) => b.prijs - a.prijs);
    if (sort === "opp-af") r.sort((a, b) => (b.m2 || 0) - (a.m2 || 0));
    return r;
  }, [gefilterd, sort]);

  const totaalPaginas = Math.max(1, Math.ceil(gesorteerd.length / PER_PAGINA));
  const huidige = Math.min(pagina, totaalPaginas - 1);
  const zichtbaar = gesorteerd.slice(huidige * PER_PAGINA, (huidige + 1) * PER_PAGINA);

  const aantalFilters =
    [prijsVan, prijsTot, oppVan, oppTot, perceelVan, slaapkamers, sinds, openHuis].filter(Boolean).length +
    soorten.length + types.length + labels.length + bouw.length;

  function wis() {
    setPrijsVan(0); setPrijsTot(0); setOppVan(0); setOppTot(0); setPerceelVan(0); setSlaapkamers(0);
    setSoorten([]); setTypes([]); setLabels([]); setBouw([]); setSinds(""); setOpenHuis(false);
  }
  const wissel = (lijst: string[], zet: (v: string[]) => void, v: string, aan: boolean) =>
    zet(aan ? [...lijst, v] : lijst.filter((x) => x !== v));
  const telType = (tp: string) => listings.filter((l) => l.type === tp && (!vasteProvincie || l.provincie === vasteProvincie)).length;

  const sel = "field w-full text-sm py-2";

  const filters = (
    <div className="bg-white border border-lijn rounded-2xl px-4">
      <Groep titel="Prijs">
        <div className="grid grid-cols-2 gap-2">
          <select className={sel} aria-label="Prijs vanaf" value={prijsVan} onChange={(e) => setPrijsVan(Number(e.target.value))}>
            <option value={0}>Van</option>
            {PRIJZEN.map((p) => <option key={p} value={p}>{euro(p)}</option>)}
          </select>
          <select className={sel} aria-label="Prijs tot" value={prijsTot} onChange={(e) => setPrijsTot(Number(e.target.value))}>
            <option value={0}>Tot</option>
            {PRIJZEN.map((p) => <option key={p} value={p}>{euro(p)}</option>)}
          </select>
        </div>
      </Groep>
      <Groep titel="Aangeboden sinds">
        <select className={sel} aria-label="Aangeboden sinds" value={sinds} onChange={(e) => setSinds(e.target.value)}>
          {SINDS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </Groep>
      <Groep titel="Soort object">
        <Keuze label="Woonhuis" checked={soorten.includes("woonhuis")} onChange={(v) => wissel(soorten, setSoorten, "woonhuis", v)} />
        <Keuze label="Appartement" checked={soorten.includes("appartement")} onChange={(v) => wissel(soorten, setSoorten, "appartement", v)} />
      </Groep>
      {alleTypes.length > 0 && (
        <Groep titel="Soort woning">
          {alleTypes.map((tp) => (
            <Keuze key={tp} label={tp} aantal={telType(tp)} checked={types.includes(tp)} onChange={(v) => wissel(types, setTypes, tp, v)} />
          ))}
        </Groep>
      )}
      <Groep titel="Woonoppervlakte">
        <div className="grid grid-cols-2 gap-2">
          <select className={sel} aria-label="Woonoppervlakte vanaf" value={oppVan} onChange={(e) => setOppVan(Number(e.target.value))}>
            <option value={0}>Van</option>
            {OPPERVLAKTES.map((m) => <option key={m} value={m}>{m} m²</option>)}
          </select>
          <select className={sel} aria-label="Woonoppervlakte tot" value={oppTot} onChange={(e) => setOppTot(Number(e.target.value))}>
            <option value={0}>Tot</option>
            {OPPERVLAKTES.map((m) => <option key={m} value={m}>{m} m²</option>)}
          </select>
        </div>
      </Groep>
      <Groep titel="Perceeloppervlakte">
        <select className={sel} aria-label="Perceeloppervlakte vanaf" value={perceelVan} onChange={(e) => setPerceelVan(Number(e.target.value))}>
          <option value={0}>Geen voorkeur</option>
          {PERCELEN.map((m) => <option key={m} value={m}>{m}+ m²</option>)}
        </select>
      </Groep>
      <Groep titel="Aantal slaapkamers">
        <div className="flex flex-wrap gap-1.5">
          {[0, ...SLAAPKAMERS].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSlaapkamers(n)}
              className={`rounded-full px-3 py-1 text-sm font-display font-semibold border ${slaapkamers === n ? "text-white border-transparent" : "text-bosgroen-dk border-lijn hover:bg-zand"}`}
              style={slaapkamers === n ? { background: "#1E3A5F" } : undefined}
            >
              {n === 0 ? "Alle" : `${n}+`}
            </button>
          ))}
        </div>
      </Groep>
      <Groep titel="Energielabel">
        <div className="flex flex-wrap gap-1.5">
          {LABELS.map((lb) => {
            const aan = labels.includes(lb);
            return (
              <button
                key={lb}
                type="button"
                onClick={() => wissel(labels, setLabels, lb, !aan)}
                className={`w-9 h-8 rounded-lg text-sm font-display font-bold border ${aan ? "text-white border-transparent" : "text-bosgroen-dk border-lijn hover:bg-zand"}`}
                style={aan ? { background: "#1E3A5F" } : undefined}
              >
                {lb}
              </button>
            );
          })}
        </div>
      </Groep>
      <Groep titel="Bouwperiode">
        {BOUWPERIODES.map((b) => (
          <Keuze key={b.v} label={b.l} checked={bouw.includes(b.v)} onChange={(v) => wissel(bouw, setBouw, b.v, v)} />
        ))}
      </Groep>
      <Groep titel="Open huis">
        <Keuze label="Alleen woningen met een open huis" checked={openHuis} onChange={setOpenHuis} />
      </Groep>
    </div>
  );

  return (
    <div id="aanbod" className="mt-6 scroll-mt-20">
      {/* Zoekvak met straal */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(invoer);
        }}
        className="flex flex-wrap gap-2.5 bg-white p-2.5 rounded-2xl border border-lijn"
      >
        <label className="flex-[1_1_260px] flex flex-col gap-0.5 px-2.5 py-1.5 text-xs font-semibold text-grijs">
          Plaats, buurt, adres of postcode
          <input
            type="text"
            value={invoer}
            onChange={(e) => setInvoer(e.target.value)}
            placeholder="Bijvoorbeeld Brunssum of 6445"
            className="border-0 text-base font-sans outline-none text-inkt py-1 bg-transparent"
          />
        </label>
        <label className="flex-[0_1_140px] flex flex-col gap-0.5 px-2.5 py-1.5 text-xs font-semibold text-grijs">
          Straal
          <select value={straal} onChange={(e) => { setStraal(Number(e.target.value)); setQ(invoer); }} className="border-0 text-base font-sans bg-transparent py-1 text-inkt">
            {STRALEN.map((s) => <option key={s} value={s}>+ {s} km</option>)}
          </select>
        </label>
        <button type="submit" className="btn flex-[0_0_auto] min-h-[52px] px-6 text-base">Zoeken</button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] items-start">
        {/* Filters: op desktop links, op mobiel uitklapbaar */}
        <aside>
          <div className="flex items-center justify-between lg:mb-2">
            <button type="button" onClick={() => setFiltersOpen((v) => !v)} className="lg:hidden btn btn-ghost text-sm">
              Filters{aantalFilters ? ` (${aantalFilters})` : ""} {filtersOpen ? "▴" : "▾"}
            </button>
            <span className="hidden lg:block font-display font-extrabold text-lg text-bosgroen-dk">Filters</span>
            {aantalFilters > 0 && (
              <button type="button" onClick={wis} className="text-sm font-semibold text-bosgroen hover:underline">Wis filters</button>
            )}
          </div>
          <div className={`${filtersOpen ? "block mt-3" : "hidden"} lg:block`}>{filters}</div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="font-display font-bold text-bosgroen-dk">
              {gesorteerd.length} {gesorteerd.length === 1 ? "koopwoning" : "koopwoningen"}
              {q.trim() && <span className="font-normal text-grijs"> {straal ? `binnen ${straal} km van` : "in"} {q.trim()}</span>}
            </div>
            <select className="field w-auto text-sm py-2 ml-auto" aria-label="Sorteren" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Relevantie</option>
              <option value="nieuw">Nieuwste eerst</option>
              <option value="prijs-op">Prijs (laag - hoog)</option>
              <option value="prijs-af">Prijs (hoog - laag)</option>
              <option value="opp-af">Woonoppervlakte (groot - klein)</option>
            </select>
            <div className="inline-flex rounded-full border border-lijn overflow-hidden text-sm font-display font-semibold">
              {(["lijst", "kaart"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 ${view === v ? "text-white" : "text-bosgroen-dk hover:bg-zand"}`}
                  style={view === v ? { background: "#1E3A5F" } : undefined}
                >
                  {v === "lijst" ? "☰ Lijst" : "Kaart"}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-grijs -mt-2 mb-4">
            <a href="/disclaimer#rangschikking" className="underline hover:text-bosgroen">Hoe bepalen we de volgorde?</a>
          </p>

          {gesorteerd.length === 0 ? (
            <div className="card text-grijs">
              Geen woningen gevonden met deze zoekopdracht. Probeer een grotere straal of minder filters.
              <div className="mt-2 text-sm">
                Zoek je een recreatiewoning of vakantiehuis?{" "}
                <a href={MOOIHUUS_URL} className="text-bosgroen font-semibold hover:underline">Misschien staat het op Mooihuus.nl →</a>
              </div>
            </div>
          ) : view === "kaart" ? (
            <Kaart listings={gesorteerd.slice(0, 500)} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {zichtbaar.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
              {totaalPaginas > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button type="button" onClick={() => setPagina(Math.max(0, huidige - 1))} disabled={huidige === 0} className="btn btn-ghost text-sm disabled:opacity-40">← Vorige</button>
                  <span className="text-sm text-grijs font-display font-semibold">Pagina {huidige + 1} van {totaalPaginas}</span>
                  <button type="button" onClick={() => setPagina(Math.min(totaalPaginas - 1, huidige + 1))} disabled={huidige >= totaalPaginas - 1} className="btn btn-ghost text-sm disabled:opacity-40">Volgende →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
