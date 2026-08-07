"use client";

import { useState } from "react";

// Toont de betaalstatus en laat de beheerder een betaling handmatig
// op betaald (of terug op open) zetten — vangnet voor handmatige betalingen.
export function BetalingStatusKnop({ paymentId, status }: { paymentId: string; status: string }) {
  const [st, setSt] = useState(status);
  const [busy, setBusy] = useState(false);

  async function zet(betaald: boolean) {
    setBusy(true);
    const res = await fetch("/api/beheer/factuur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, markeerBetaald: betaald }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setSt(d.status);
  }

  if (st === "paid") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-bosgroen font-semibold">Betaald ✓</span>
        <button onClick={() => zet(false)} disabled={busy} className="text-grijs text-[0.7rem] underline">open zetten</button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-oranje-dk">Open</span>
      <button onClick={() => zet(true)} disabled={busy} className="btn btn-ghost text-[0.7rem] py-0.5 px-1.5">{busy ? "…" : "Markeer betaald"}</button>
    </span>
  );
}
