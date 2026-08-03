"use client";

import { useState } from "react";

const PROVINCIES = [
  "Groningen", "Friesland", "Drenthe", "Overijssel", "Flevoland", "Gelderland",
  "Utrecht", "Noord-Holland", "Zuid-Holland", "Zeeland", "Noord-Brabant", "Limburg",
];

export function ZoekForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | number>(null);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({
    naam: "", email: "", doel: "alle", provincie: "alle",
    prijsMax: "", personenMin: "", alerts: true,
  });
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/zoekopdracht", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          prijsMax: f.prijsMax ? Number(f.prijsMax) : undefined,
          personenMin: f.personenMin ? Number(f.personenMin) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Er ging iets mis."); setBusy(false); return; }
      setDone(data.matches ?? 0);
    } catch {
      setErr("Er ging iets mis. Probeer het opnieuw."); setBusy(false);
    }
  }

  if (done !== null) {
    return (
      <div className="bg-salie-lt text-bosgroen-dk rounded-xl p-4 text-sm">
        <div className="font-semibold">✓ Je woning-alert staat aan!</div>
        <p className="mt-1">
          {done > 0
            ? `Er passen nu al ${done} woning${done === 1 ? "" : "en"} bij je zoekopdracht — check je mail, we hebben ze meegestuurd.`
            : "Er staat nu nog niets dat precies past, maar zodra dat verandert krijg je meteen een mailtje."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="grid gap-3 sm:grid-cols-2">
      <input required value={f.naam} onChange={(e) => set("naam", e.target.value)} placeholder="Je naam" className="field" />
      <input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="Je e-mailadres" className="field" />
      <select value={f.doel} onChange={(e) => set("doel", e.target.value)} className="field">
        <option value="alle">Koop & huur</option>
        <option value="koop">Te koop</option>
        <option value="huur">Te huur</option>
      </select>
      <select value={f.provincie} onChange={(e) => set("provincie", e.target.value)} className="field">
        <option value="alle">Alle provincies</option>
        {PROVINCIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <input type="number" min="0" value={f.prijsMax} onChange={(e) => set("prijsMax", e.target.value)} placeholder="Max. prijs (€)" className="field" />
      <input type="number" min="0" value={f.personenMin} onChange={(e) => set("personenMin", e.target.value)} placeholder="Min. aantal personen" className="field" />
      <label className="flex items-center gap-2 text-sm text-grijs sm:col-span-2">
        <input type="checkbox" checked={f.alerts} onChange={(e) => set("alerts", e.target.checked)} />
        Stuur me een mail zodra er een passende woning bij komt
      </label>
      {err && <p className="text-sm text-oranje-dk sm:col-span-2">{err}</p>}
      <button type="submit" disabled={busy} className="btn sm:col-span-2">
        {busy ? "Bezig…" : "Zet mijn woning-alert aan"}
      </button>
    </form>
  );
}
