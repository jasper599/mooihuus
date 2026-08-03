"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm() {
  const router = useRouter();
  const [naam, setNaam] = useState("");
  const [plaats, setPlaats] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tekst, setTekst] = useState("");
  const [busy, setBusy] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const [err, setErr] = useState("");

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!rating) return setErr("Kies een aantal sterren.");
    setBusy(true);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ naam, plaats, rating, tekst }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Er ging iets mis.");
    setKlaar(true);
    router.refresh();
  }

  if (klaar) {
    return (
      <div className="card bg-[#EAF4EC] border-[#CADFCF]">
        <div className="text-2xl mb-1">🌲 Bedankt!</div>
        <p className="text-bosgroen-dk text-sm">Je beoordeling staat er meteen bij. Fijn dat je Mooihuus helpt groeien.</p>
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="card space-y-3">
      <div className="font-display font-bold text-bosgroen-dk">Deel jouw ervaring</div>
      {err && <div className="rounded-xl p-3 text-sm bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk">{err}</div>}
      <div>
        <div className="label">Je beoordeling</div>
        <div className="flex gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              type="button"
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="leading-none"
              aria-label={`${s} sterren`}
            >
              <span className={(hover || rating) >= s ? "text-oranje" : "text-lijn"}>★</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Je naam</label><input className="field" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="bijv. Anouk de Vries" /></div>
        <div><label className="label">Plaats (optioneel)</label><input className="field" value={plaats} onChange={(e) => setPlaats(e.target.value)} placeholder="bijv. Zwolle" /></div>
      </div>
      <div><label className="label">Je ervaring</label><textarea className="field min-h-[100px]" value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder="Waarover ben je tevreden?" /></div>
      <button className="btn w-full" disabled={busy}>{busy ? "Versturen…" : "Plaats beoordeling"}</button>
    </form>
  );
}
