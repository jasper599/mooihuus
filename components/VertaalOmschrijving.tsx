"use client";

import { useState } from "react";

export function VertaalOmschrijving({ text }: { text: string }) {
  const [taal, setTaal] = useState<"nl" | "en" | "de">("nl");
  const [vertaald, setVertaald] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function kies(t: "nl" | "en" | "de") {
    if (t === "nl" || vertaald[t]) { setTaal(t); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/vertaal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, taal: t }),
      });
      const d = await res.json();
      setVertaald((v) => ({ ...v, [t]: d.vertaald || text }));
      setTaal(t);
    } finally {
      setBusy(false);
    }
  }

  const knop = (t: "nl" | "en" | "de", label: string) => (
    <button
      onClick={() => kies(t)}
      disabled={busy}
      className={`text-xs font-display font-semibold rounded-full px-2.5 py-1 ${taal === t ? "bg-bosgroen text-white" : "bg-white border border-lijn text-bosgroen-dk hover:bg-zand"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs text-grijs mr-1">Taal:</span>
        {knop("nl", "🇳🇱 NL")}
        {knop("en", "🇬🇧 EN")}
        {knop("de", "🇩🇪 DE")}
        {busy && <span className="text-xs text-grijs">vertalen…</span>}
      </div>
      <p className="leading-relaxed whitespace-pre-line">{taal === "nl" ? text : vertaald[taal] || text}</p>
    </div>
  );
}
