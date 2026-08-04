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

  return (
    <div>
      <button onClick={maak} disabled={busy} className="btn btn-ghost text-xs py-1 px-2">
        {busy ? "Bezig…" : "Maak factuur"}
      </button>
      {msg && <div className={`text-xs mt-1 ${msg.ok ? "text-bosgroen-dk" : "text-oranje-dk"}`}>{msg.text}</div>}
    </div>
  );
}
