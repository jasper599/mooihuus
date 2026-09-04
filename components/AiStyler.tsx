"use client";

import { useState } from "react";

const STIJLEN = [
  { key: "modern", label: "Modern" },
  { key: "landelijk", label: "Landelijk" },
  { key: "scandinavisch", label: "Scandinavisch" },
  { key: "modern-luxe", label: "Modern luxe" },
  { key: "licht-fris", label: "Licht & fris" },
];

export function AiStyler() {
  const [file, setFile] = useState<File | null>(null);
  const [voorbeeld, setVoorbeeld] = useState("");
  const [stijl, setStijl] = useState("modern");
  const [busy, setBusy] = useState(false);
  const [resultaat, setResultaat] = useState("");
  const [fout, setFout] = useState("");
  const [rest, setRest] = useState<number | null>(null);

  function kies(f: File | null) {
    setResultaat("");
    setFout("");
    setFile(f);
    setVoorbeeld(f ? URL.createObjectURL(f) : "");
  }

  async function genereer() {
    if (!file || busy) return;
    setBusy(true);
    setFout("");
    setResultaat("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("stijl", stijl);
      const res = await fetch("/api/style", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setFout(data.error || "Er ging iets mis.");
      else {
        setResultaat(data.url);
        if (typeof data.restDag === "number") setRest(data.restDag);
      }
    } catch {
      setFout("Er ging iets mis. Probeer het opnieuw.");
    }
    setBusy(false);
  }

  return (
    <div className="card">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="text-sm font-display font-semibold text-bosgroen-dk">Foto van de ruimte</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => kies(e.target.files?.[0] || null)}
            className="block mt-1 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-salie-lt file:px-3 file:py-2 file:text-bosgroen-dk file:font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-sm font-display font-semibold text-bosgroen-dk">Stijl</span>
          <select value={stijl} onChange={(e) => setStijl(e.target.value)} className="field w-full sm:w-auto mt-1">
            {STIJLEN.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button onClick={genereer} disabled={!file || busy} className="btn disabled:opacity-40 disabled:cursor-not-allowed">
          {busy ? "Bezig met genereren… (dit duurt ~10-30 sec)" : "Genereer AI-impressie"}
        </button>
        {rest !== null && <span className="text-sm text-grijs">Nog {rest} vandaag</span>}
      </div>

      {fout && <div className="mt-3 text-sm bg-[#F8E7E1] text-[#8f3620] rounded-xl p-3">{fout}</div>}

      {(voorbeeld || resultaat) && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {voorbeeld && (
            <div>
              <div className="text-xs font-display font-semibold uppercase tracking-wide text-grijs mb-1">Origineel</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={voorbeeld} alt="Origineel" className="w-full rounded-xl border border-lijn" />
            </div>
          )}
          {resultaat && (
            <div>
              <div className="text-xs font-display font-semibold uppercase tracking-wide text-oranje-dk mb-1">AI-impressie</div>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultaat} alt="AI-impressie" className="w-full rounded-xl border border-lijn" />
                <span className="absolute bottom-2 left-2 bg-inkt/80 text-white font-display font-semibold text-[0.66rem] px-2.5 py-0.5 rounded-full">
                  AI-impressie
                </span>
              </div>
              <a href={resultaat} download className="btn btn-ghost text-sm mt-2 inline-block">↓ Download</a>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-grijs mt-5 p-3 bg-creme border border-dashed border-lijn rounded-xl">
        <strong className="text-bosgroen-dk">Let op:</strong> een AI-impressie is een sfeerbeeld, geen weergave van de
        werkelijke staat van de woning. Gebruik het alleen ter inspiratie en label het duidelijk in je advertentie, zodat
        kopers niet worden misleid.
      </p>
    </div>
  );
}
