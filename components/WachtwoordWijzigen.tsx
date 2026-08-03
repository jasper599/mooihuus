"use client";

import { useState } from "react";

export function WachtwoordWijzigen() {
  const [huidig, setHuidig] = useState("");
  const [nieuw, setNieuw] = useState("");
  const [herhaal, setHerhaal] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (nieuw !== herhaal) { setMsg({ ok: false, text: "De twee nieuwe wachtwoorden zijn niet gelijk." }); return; }
    setBusy(true);
    const res = await fetch("/api/account/wachtwoord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ huidig, nieuw }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg({ ok: false, text: data.error || "Er ging iets mis." }); return; }
    setMsg({ ok: true, text: "✓ Je wachtwoord is aangepast." });
    setHuidig(""); setNieuw(""); setHerhaal("");
  }

  return (
    <form onSubmit={submit} className="space-y-1">
      {msg && (
        <div className={`rounded-xl p-3 text-sm mb-2 ${msg.ok ? "bg-[#EAF4EC] border border-[#CADFCF] text-bosgroen-dk" : "bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk"}`}>{msg.text}</div>
      )}
      <label className="label">Huidig wachtwoord</label>
      <input type="password" className="field" value={huidig} onChange={(e) => setHuidig(e.target.value)} required />
      <label className="label">Nieuw wachtwoord</label>
      <input type="password" className="field" value={nieuw} onChange={(e) => setNieuw(e.target.value)} required />
      <label className="label">Herhaal nieuw wachtwoord</label>
      <input type="password" className="field" value={herhaal} onChange={(e) => setHerhaal(e.target.value)} required />
      <button className="btn w-full mt-4" disabled={busy}>{busy ? "Opslaan…" : "Wachtwoord wijzigen"}</button>
    </form>
  );
}
