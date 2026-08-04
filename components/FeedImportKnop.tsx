"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeedImportKnop({ bron, label }: { bron: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function sync() {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/beheer/feed-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bron }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setMsg({ ok: true, text: `✓ ${d.verwerkt} verwerkt, ${d.offline} offline gezet.` }); router.refresh(); }
    else setMsg({ ok: false, text: d.error || "Nog niet beschikbaar." });
  }

  return (
    <div className="flex flex-col gap-1">
      <button onClick={sync} disabled={busy} className="btn btn-ghost text-sm">
        {busy ? "Bezig…" : `Sync ${label}`}
      </button>
      {msg && <div className={`text-xs ${msg.ok ? "text-bosgroen-dk" : "text-oranje-dk"}`}>{msg.text}</div>}
    </div>
  );
}
