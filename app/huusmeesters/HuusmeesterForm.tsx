"use client";

import { useState } from "react";

const VAKKEN = ["Schoonmaak", "Hovenier", "Onderhoud", "Interieur & inventaris", "Anders"];

export function HuusmeesterForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ bedrijf: "", naam: "", vak: "Schoonmaak", regio: "", email: "" });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/huusmeester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Er ging iets mis.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setErr("Er ging iets mis. Probeer het opnieuw.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="bg-salie-lt text-bosgroen-dk rounded-xl p-4 text-sm font-semibold">
        ✓ Bedankt! Je aanmelding is binnen. We nemen contact op om je in de Huusmeesters-gids te zetten.
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="grid gap-3 sm:grid-cols-2">
      <input required value={form.bedrijf} onChange={(e) => set("bedrijf", e.target.value)} placeholder="Bedrijfsnaam" className="field" />
      <input required value={form.naam} onChange={(e) => set("naam", e.target.value)} placeholder="Contactpersoon" className="field" />
      <select value={form.vak} onChange={(e) => set("vak", e.target.value)} className="field">
        {VAKKEN.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      <input value={form.regio} onChange={(e) => set("regio", e.target.value)} placeholder="Regio (bijv. Veluwe)" className="field" />
      <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="E-mailadres" className="field sm:col-span-2" />
      {err && <p className="text-sm text-oranje-dk sm:col-span-2">{err}</p>}
      <button type="submit" disabled={busy} className="btn sm:col-span-2">
        {busy ? "Versturen…" : "Meld mijn bedrijf aan"}
      </button>
    </form>
  );
}
