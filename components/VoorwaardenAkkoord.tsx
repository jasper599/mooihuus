"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Wordt in het dashboard getoond zolang iemand nog geen akkoord heeft gegeven op
// de actuele voorwaarden: onder meer makelaars wier woningen via Kolibri of
// Realworks binnenkomen en die dus nooit het plaatsformulier doorlopen.
export function VoorwaardenAkkoord({ versieLabel, eerderAkkoord }: { versieLabel: string; eerderAkkoord: boolean }) {
  const router = useRouter();
  const [akkoord, setAkkoord] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fout, setFout] = useState("");

  async function bevestig() {
    setBusy(true);
    setFout("");
    const res = await fetch("/api/account/voorwaarden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ akkoord }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setFout(d.error || "Er ging iets mis. Probeer het opnieuw.");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto card">
      <h1 className="font-display font-extrabold text-2xl text-bosgroen-dk">
        {eerderAkkoord ? "Onze voorwaarden zijn bijgewerkt" : "Nog één stap"}
      </h1>
      <p className="text-grijs mt-2">
        {eerderAkkoord
          ? `We hebben de algemene voorwaarden en huisregels bijgewerkt (versie ${versieLabel}). Lees ze even door en geef je akkoord om verder te gaan.`
          : `Voordat je verdergaat, vragen we je akkoord te gaan met onze algemene voorwaarden en huisregels (versie ${versieLabel}). Die gelden voor alle woningen in je account, ook als ze automatisch via je makelaarssysteem binnenkomen.`}
      </p>
      <label className="flex items-start gap-2 text-sm mt-4 cursor-pointer">
        <input type="checkbox" className="mt-1" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} />
        <span>
          Ik ga akkoord met de{" "}
          <a href="/voorwaarden" target="_blank" rel="noopener" className="underline text-bosgroen font-semibold">algemene voorwaarden</a>{" "}en{" "}
          <a href="/voorwaarden#huisregels" target="_blank" rel="noopener" className="underline text-bosgroen font-semibold">huisregels</a>.
        </span>
      </label>
      {fout && <div className="bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk rounded-xl p-3 text-sm mt-3">{fout}</div>}
      <button className="btn w-full mt-4" onClick={bevestig} disabled={!akkoord || busy}>
        {busy ? "Bezig…" : "Akkoord en verder"}
      </button>
    </div>
  );
}
