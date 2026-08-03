"use client";

import { useState } from "react";

const HULP_OPTIES = [
  "Verzekering",
  "Hypotheek / financiering",
  "Schoonmaak / wissel",
  "Tuin & buiten",
  "Klein onderhoud / klussen",
  "Interieur & inventaris",
  "Berging / tuinhuis",
  "Wellness (hottub, sauna, jacuzzi)",
  "Sleutelbeheer / toezicht",
  "Iets anders",
];

export function ContactForm({
  hulp = false,
  defaultOnderwerp = "",
  knop = "Verstuur",
}: {
  hulp?: boolean;
  defaultOnderwerp?: string;
  knop?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    naam: "",
    email: "",
    onderwerp: defaultOnderwerp,
    categorie: hulp ? HULP_OPTIES[0] : "",
    regio: "",
    bericht: "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/contact", {
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
        ✓ Bedankt, je bericht is verstuurd. We nemen zo snel mogelijk contact met je op.
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="grid gap-3 sm:grid-cols-2">
      <input required value={form.naam} onChange={(e) => set("naam", e.target.value)} placeholder="Je naam" className="field" />
      <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Je e-mailadres" className="field" />
      {hulp ? (
        <>
          <select value={form.categorie} onChange={(e) => set("categorie", e.target.value)} className="field">
            {HULP_OPTIES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <input value={form.regio} onChange={(e) => set("regio", e.target.value)} placeholder="Regio of park (bijv. Veluwe)" className="field" />
        </>
      ) : (
        <input value={form.onderwerp} onChange={(e) => set("onderwerp", e.target.value)} placeholder="Onderwerp" className="field sm:col-span-2" />
      )}
      <textarea required value={form.bericht} onChange={(e) => set("bericht", e.target.value)} placeholder={hulp ? "Waar kunnen we je mee helpen?" : "Je bericht…"} className="field min-h-[110px] sm:col-span-2" />
      {err && <p className="text-sm text-oranje-dk sm:col-span-2">{err}</p>}
      <button type="submit" disabled={busy} className="btn sm:col-span-2">
        {busy ? "Versturen…" : knop}
      </button>
    </form>
  );
}
