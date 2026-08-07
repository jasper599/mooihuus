"use client";

import { useState } from "react";

// Toont de betaalstatus en laat de beheerder handmatig ingrijpen:
// - Markeer betaald (vangnet voor handmatige betalingen buiten de link om)
// - Crediteer (annuleren — telt niet meer mee, mailt niemand)
// - Terug naar open
export function BetalingStatusKnop({ paymentId, status }: { paymentId: string; status: string }) {
  const [st, setSt] = useState(status);
  const [busy, setBusy] = useState(false);

  async function zet(actie: "betaald" | "open" | "crediteer") {
    setBusy(true);
    const res = await fetch("/api/beheer/factuur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, actie }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setSt(d.status);
  }

  if (st === "paid") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-bosgroen font-semibold">Betaald ✓</span>
        <button onClick={() => zet("open")} disabled={busy} className="text-grijs text-[0.7rem] underline">open zetten</button>
      </span>
    );
  }

  if (st === "failed") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-grijs font-semibold">Gecrediteerd</span>
        <button onClick={() => zet("open")} disabled={busy} className="text-grijs text-[0.7rem] underline">terug naar open</button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span className="text-oranje-dk">Open</span>
      <button onClick={() => zet("betaald")} disabled={busy} className="btn btn-ghost text-[0.7rem] py-0.5 px-1.5">{busy ? "…" : "Markeer betaald"}</button>
      <button onClick={() => zet("crediteer")} disabled={busy} className="text-oranje-dk text-[0.7rem] underline">crediteer</button>
    </span>
  );
}
