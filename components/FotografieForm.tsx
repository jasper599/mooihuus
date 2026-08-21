"use client";

import { useState } from "react";

// Aanvraagformulier voor het fotografiepakket (foto's + plattegrond + video).
// Geen directe betaling: de aanvraag komt als e-mail binnen, waarna Mooihuus
// contact opneemt om de shoot in te plannen en te factureren. Hergebruikt het
// bestaande /api/contact-eindpunt; extra velden gaan mee in het bericht.
export function FotografieForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    naam: "",
    email: "",
    telefoon: "",
    adres: "",
    regio: "",
    periode: "",
    bericht: "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const bericht =
      `Aanvraag fotografiepakket (€ 450 — foto's + plattegrond + YouTube-video)\n\n` +
      `Telefoon: ${form.telefoon || "—"}\n` +
      `Adres woning: ${form.adres || "—"}\n` +
      `Park / regio: ${form.regio || "—"}\n` +
      `Gewenste periode: ${form.periode || "—"}\n\n` +
      `Toelichting:\n${form.bericht || "—"}`;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam: form.naam,
          email: form.email,
          onderwerp: "Fotografie-aanvraag (€ 450)",
          categorie: "Fotografie",
          regio: form.regio,
          bericht,
        }),
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
        ✓ Bedankt voor je aanvraag! We nemen zo snel mogelijk contact met je op om de fotoshoot in te plannen.
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="grid gap-3 sm:grid-cols-2">
      <input required value={form.naam} onChange={(e) => set("naam", e.target.value)} placeholder="Je naam" className="field" />
      <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Je e-mailadres" className="field" />
      <input value={form.telefoon} onChange={(e) => set("telefoon", e.target.value)} placeholder="Telefoonnummer" className="field" />
      <input value={form.regio} onChange={(e) => set("regio", e.target.value)} placeholder="Park of regio (bijv. Veluwe)" className="field" />
      <input value={form.adres} onChange={(e) => set("adres", e.target.value)} placeholder="Adres van de woning" className="field sm:col-span-2" />
      <input value={form.periode} onChange={(e) => set("periode", e.target.value)} placeholder="Gewenste periode (bijv. deze maand, z.s.m.)" className="field sm:col-span-2" />
      <textarea value={form.bericht} onChange={(e) => set("bericht", e.target.value)} placeholder="Vragen of opmerkingen? (optioneel)" className="field min-h-[90px] sm:col-span-2" />
      {err && <p className="text-sm text-oranje-dk sm:col-span-2">{err}</p>}
      <button type="submit" disabled={busy} className="btn sm:col-span-2">
        {busy ? "Versturen…" : "Vraag het fotografiepakket aan"}
      </button>
    </form>
  );
}
