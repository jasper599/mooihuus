"use client";

import { useState } from "react";
import Link from "next/link";

export default function WachtwoordVergeten() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/wachtwoord-vergeten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    setDone(true);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Wachtwoord vergeten</h1>
      <p className="text-grijs mb-5">Vul je e-mailadres in, dan sturen we je een link om een nieuw wachtwoord in te stellen.</p>
      {done ? (
        <div className="card">
          <div className="bg-[#EAF4EC] border border-[#CADFCF] text-bosgroen-dk rounded-xl p-3 text-sm">
            ✓ Als er een account bij dit e-mailadres hoort, is er een resetlink verstuurd. Check je mail (en je spam).
          </div>
          <p className="text-sm text-grijs mt-4 text-center">
            <Link href="/inloggen" className="text-bosgroen font-semibold">Terug naar inloggen</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-1">
          <label className="label">E-mail</label>
          <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn w-full mt-4" disabled={busy}>{busy ? "Versturen…" : "Stuur resetlink"}</button>
          <p className="text-sm text-grijs mt-4 text-center">
            <Link href="/inloggen" className="text-bosgroen font-semibold">Terug naar inloggen</Link>
          </p>
        </form>
      )}
    </div>
  );
}
