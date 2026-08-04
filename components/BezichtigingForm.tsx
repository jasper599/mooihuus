"use client";

import { useState } from "react";

const TIJDEN = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "in overleg"];

export function BezichtigingForm({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ naam: "", email: "", datum: "", tijd: "10:00", bericht: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const res = await fetch("/api/bezichtiging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, ...f }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d.error || "Er ging iets mis."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-[#EAF4EC] border border-[#CADFCF] rounded-xl p-3 text-sm text-bosgroen-dk">
        ✓ Je bezichtigingsverzoek is verstuurd. De aanbieder neemt contact op om een moment te bevestigen.
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost w-full text-sm">📅 Bezichtiging plannen</button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="font-display font-bold text-bosgroen-dk text-sm">Bezichtiging plannen</div>
      {err && <div className="text-sm text-oranje-dk">{err}</div>}
      <input required className="field" placeholder="Je naam" value={f.naam} onChange={(e) => set("naam", e.target.value)} />
      <input required type="email" className="field" placeholder="Je e-mail" value={f.email} onChange={(e) => set("email", e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input required type="date" className="field" value={f.datum} onChange={(e) => set("datum", e.target.value)} />
        <select className="field" value={f.tijd} onChange={(e) => set("tijd", e.target.value)}>
          {TIJDEN.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <textarea className="field min-h-[70px]" placeholder="Eventuele toelichting (optioneel)" value={f.bericht} onChange={(e) => set("bericht", e.target.value)} />
      <button className="btn w-full" disabled={busy}>{busy ? "Versturen…" : "Verstuur verzoek"}</button>
      <p className="text-xs text-grijs">
        Let op: dit is een <strong>voorkeursmoment</strong>, nog geen bevestigde afspraak. De aanbieder neemt contact op om de bezichtiging definitief in te plannen.
      </p>
    </form>
  );
}
