"use client";

import { useState } from "react";

export type IdeeLabels = {
  naamPlaceholder: string;
  emailPlaceholder: string;
  optieIdee: string;
  optieOpmerking: string;
  tekstPlaceholder: string;
  knop: string;
  bezig: string;
  dank: string;
  fout: string;
  optioneel: string;
};

export function IdeeForm({ labels }: { labels: IdeeLabels }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    naam: "",
    email: "",
    categorie: "idee",
    tekst: "",
    bedrijf: "", // honeypot — hoort leeg te blijven
  });
  const [ts] = useState(() => Date.now()); // laadtijd, voor de antispam-tijdcontrole

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/ideeen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ts }),
      });
      const data = await res.json().catch(() => ({}));
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
        ✓ {labels.dank}
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="grid gap-3 sm:grid-cols-2">
      {/* Honeypot: onzichtbaar voor mensen, bots vullen het wél in. */}
      <input
        type="text"
        name="bedrijf"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.bedrijf}
        onChange={(e) => set("bedrijf", e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <select value={form.categorie} onChange={(e) => set("categorie", e.target.value)} className="field sm:col-span-2">
        <option value="idee">{labels.optieIdee}</option>
        <option value="opmerking">{labels.optieOpmerking}</option>
      </select>
      <textarea
        required
        value={form.tekst}
        onChange={(e) => set("tekst", e.target.value)}
        placeholder={labels.tekstPlaceholder}
        className="field min-h-[130px] sm:col-span-2"
      />
      <input value={form.naam} onChange={(e) => set("naam", e.target.value)} placeholder={`${labels.naamPlaceholder} (${labels.optioneel})`} className="field" />
      <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder={`${labels.emailPlaceholder} (${labels.optioneel})`} className="field" />
      {err && <p className="text-sm text-oranje-dk sm:col-span-2">{err}</p>}
      <button type="submit" disabled={busy} className="btn sm:col-span-2">
        {busy ? labels.bezig : labels.knop}
      </button>
    </form>
  );
}
