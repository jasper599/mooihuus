"use client";

import { useState } from "react";

// Aanvraagformulier voor de Guest Experience (mystery guest voor parken).
// Geen directe betaling: de aanvraag komt als e-mail binnen, waarna Mooihuus
// contact opneemt om het bezoek te plannen en te factureren. Hergebruikt het
// bestaande /api/contact-eindpunt; extra velden gaan mee in het bericht.
const PAKKETTEN = [
  "Basis-audit (1 nacht, alleen of stel) — vanaf € 1.500",
  "Volledige Guest Experience (gezin, 2 nachten) — € 2.750–3.500",
  "Seizoen / partnerschap — vanaf € 6.500",
  "Weet ik nog niet / advies gewenst",
];

export function GuestExperienceForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    organisatie: "",
    contactpersoon: "",
    email: "",
    telefoon: "",
    regio: "",
    pakket: PAKKETTEN[0],
    testen: "",
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
      `Aanvraag Guest Experience (mystery guest)\n\n` +
      `Park / organisatie: ${form.organisatie || "—"}\n` +
      `Contactpersoon: ${form.contactpersoon || "—"}\n` +
      `Telefoon: ${form.telefoon || "—"}\n` +
      `Locatie / regio: ${form.regio || "—"}\n` +
      `Interesse in: ${form.pakket}\n` +
      `Vooral testen: ${form.testen || "—"}\n` +
      `Gewenste periode: ${form.periode || "—"}\n\n` +
      `Toelichting:\n${form.bericht || "—"}\n\n` +
      `Let op: prijzen zijn exclusief boekings- en verblijfskosten (worden als onkosten doorberekend).`;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam: form.contactpersoon || form.organisatie,
          email: form.email,
          onderwerp: "Guest Experience-aanvraag",
          categorie: "Guest Experience",
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
        ✓ Bedankt voor je aanvraag! We nemen zo snel mogelijk contact met je op om het bezoek te bespreken en in te plannen.
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="grid gap-3 sm:grid-cols-2">
      <input required value={form.organisatie} onChange={(e) => set("organisatie", e.target.value)} placeholder="Naam park / organisatie" className="field" />
      <input required value={form.contactpersoon} onChange={(e) => set("contactpersoon", e.target.value)} placeholder="Contactpersoon" className="field" />
      <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="E-mailadres" className="field" />
      <input value={form.telefoon} onChange={(e) => set("telefoon", e.target.value)} placeholder="Telefoonnummer" className="field" />
      <input value={form.regio} onChange={(e) => set("regio", e.target.value)} placeholder="Locatie / regio van het park" className="field sm:col-span-2" />
      <label className="label sm:col-span-2 -mb-1">Interesse in</label>
      <select value={form.pakket} onChange={(e) => set("pakket", e.target.value)} className="field sm:col-span-2">
        {PAKKETTEN.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <input value={form.testen} onChange={(e) => set("testen", e.target.value)} placeholder="Wat wil je vooral getest hebben? (optioneel)" className="field sm:col-span-2" />
      <input value={form.periode} onChange={(e) => set("periode", e.target.value)} placeholder="Gewenste periode (bijv. dit seizoen)" className="field sm:col-span-2" />
      <textarea value={form.bericht} onChange={(e) => set("bericht", e.target.value)} placeholder="Vragen of opmerkingen? (optioneel)" className="field min-h-[90px] sm:col-span-2" />
      {err && <p className="text-sm text-oranje-dk sm:col-span-2">{err}</p>}
      <button type="submit" disabled={busy} className="btn sm:col-span-2">
        {busy ? "Versturen…" : "Vraag de Guest Experience aan"}
      </button>
      <p className="text-xs text-grijs sm:col-span-2">
        Alle bedragen zijn exclusief boekings- en verblijfskosten; die worden als onkosten doorberekend. Een aanvraag is vrijblijvend.
      </p>
    </form>
  );
}
