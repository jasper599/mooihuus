"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Page() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto text-grijs">Laden…</div>}>
      <WachtwoordReset />
    </Suspense>
  );
}

function WachtwoordReset() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [nieuw, setNieuw] = useState("");
  const [herhaal, setHerhaal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (nieuw !== herhaal) { setError("De twee wachtwoorden zijn niet gelijk."); return; }
    if (nieuw.length < 6) { setError("Je wachtwoord moet minstens 6 tekens zijn."); return; }
    setBusy(true);
    const res = await fetch("/api/wachtwoord-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nieuw }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "Er ging iets mis."); return; }
    setDone(true);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Nieuw wachtwoord</h1>
      <p className="text-grijs mb-5">Kies een nieuw wachtwoord voor je Mooihuus-account.</p>
      {!token ? (
        <div className="card text-sm text-grijs">Geen geldige resetlink. Vraag een nieuwe aan via <Link href="/wachtwoord-vergeten" className="text-bosgroen font-semibold">wachtwoord vergeten</Link>.</div>
      ) : done ? (
        <div className="card">
          <div className="bg-[#EAF4EC] border border-[#CADFCF] text-bosgroen-dk rounded-xl p-3 text-sm">✓ Je wachtwoord is aangepast. Je kunt nu inloggen.</div>
          <p className="text-sm mt-4 text-center"><Link href="/inloggen" className="text-bosgroen font-semibold">Naar inloggen</Link></p>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-1">
          {error && <div className="bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk rounded-xl p-3 text-sm mb-2">{error}</div>}
          <label className="label">Nieuw wachtwoord</label>
          <input type="password" className="field" value={nieuw} onChange={(e) => setNieuw(e.target.value)} required />
          <label className="label">Herhaal wachtwoord</label>
          <input type="password" className="field" value={herhaal} onChange={(e) => setHerhaal(e.target.value)} required />
          <button className="btn w-full mt-4" disabled={busy}>{busy ? "Opslaan…" : "Wachtwoord opslaan"}</button>
        </form>
      )}
    </div>
  );
}
