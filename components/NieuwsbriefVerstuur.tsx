"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NieuwsbriefVerstuur({ aantal }: { aantal: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function verstuur(force: boolean) {
    if (!confirm(`Het nieuwste blogartikel naar ${aantal} inschrijver(s) versturen?`)) return;
    setBusy(true); setMsg("");
    const res = await fetch("/api/beheer/nieuwsbrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const d = await res.json();
    setBusy(false);
    if (d.verzonden > 0) {
      setMsg(`✓ Verstuurd naar ${d.verzonden} inschrijver(s).`);
    } else if (d.reden === "al verstuurd") {
      setMsg("Dit artikel is al verstuurd. Gebruik 'Toch opnieuw versturen' als je het nogmaals wilt sturen.");
    } else if (typeof d.reden === "string" && d.reden.startsWith("geblokkeerd")) {
      setMsg("⛔ Geblokkeerd: er is kort geleden al een nieuwsbrief verstuurd. Om dubbele verzending te voorkomen kan dit pas na 20 uur opnieuw.");
    } else {
      setMsg(`Niets verstuurd${d.reden ? ` (${d.reden})` : ""}.`);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => verstuur(false)} disabled={busy || aantal === 0} className="btn btn-green text-sm">
          {busy ? "Versturen…" : "Verstuur nieuwste blog"}
        </button>
        <button onClick={() => verstuur(true)} disabled={busy || aantal === 0} className="btn btn-ghost text-sm">
          Toch opnieuw versturen
        </button>
      </div>
      {msg && <div className="text-sm text-bosgroen-dk">{msg}</div>}
    </div>
  );
}
