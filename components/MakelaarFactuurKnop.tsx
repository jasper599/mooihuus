"use client";

import { useState } from "react";

export function MakelaarFactuurKnop({ ownerId }: { ownerId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function maak() {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/beheer/factuur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setMsg({ ok: true, text: `✓ Factuur ${d.factuurnummer}: ${d.aantal} objecten. Betaallink gemaild.` });
    else setMsg({ ok: false, text: d.reden || d.error || "Mislukt." });
  }

  async function rapport() {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/beheer/maandrapport", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: `✓ Maandrapport gemaild (${d.aantal} woningen).` } : { ok: false, text: d.reden || d.error || "Mislukt." });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={maak} disabled={busy} className="btn btn-ghost text-xs py-1 px-2">{busy ? "…" : "Factuur"}</button>
        <button onClick={rapport} disabled={busy} className="btn btn-ghost text-xs py-1 px-2">{busy ? "…" : "Rapport"}</button>
      </div>
      {msg && <div className={`text-xs ${msg.ok ? "text-bosgroen-dk" : "text-oranje-dk"}`}>{msg.text}</div>}
    </div>
  );
}
