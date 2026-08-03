"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Enquete() {
  const [listingId, setListingId] = useState<string | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [aanbeveling, setAanbeveling] = useState<number | null>(null);
  const [opmerking, setOpmerking] = useState("");
  const [klaar, setKlaar] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setListingId(p.get("listing") || undefined);
  }, []);

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    await fetch("/api/enquete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, aanbeveling, opmerking, listingId }),
    });
    setKlaar(true);
  }

  if (klaar) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="text-5xl mb-3">🌲</div>
        <h1 className="font-display font-extrabold text-2xl text-bosgroen-dk">Bedankt voor je feedback!</h1>
        <p className="text-grijs mt-2">Je helpt ons Mooihuus elke dag een beetje beter te maken.</p>
        <div className="mt-5"><Link href="/dashboard" className="btn">Naar mijn dashboard</Link></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display font-extrabold text-2xl text-bosgroen-dk">Hoe was je ervaring?</h1>
      <p className="text-grijs mb-5">Je verkoop is rond — gefeliciteerd! Vertel ons kort hoe het ging, dan verbeteren we de dienst.</p>
      <form onSubmit={verstuur} className="card">
        <div className="label">Je beoordeling</div>
        <div className="flex gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              type="button"
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="leading-none"
              aria-label={`${s} sterren`}
            >
              <span className={(hover || rating) >= s ? "text-oranje" : "text-lijn"}>★</span>
            </button>
          ))}
        </div>

        <div className="label mt-4">Zou je Mooihuus aanbevelen? <span className="text-grijs font-normal">(0–10, optioneel)</span></div>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setAanbeveling(n)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold border ${aanbeveling === n ? "bg-bosgroen text-white border-bosgroen" : "bg-white border-lijn text-inkt"}`}
            >
              {n}
            </button>
          ))}
        </div>

        <label className="label mt-4">Wat kan beter? <span className="text-grijs font-normal">(optioneel)</span></label>
        <textarea className="field min-h-[90px]" value={opmerking} onChange={(e) => setOpmerking(e.target.value)} placeholder="Je tips en opmerkingen…" />

        <button className="btn w-full mt-4" disabled={busy || !rating}>{busy ? "Versturen…" : "Verstuur feedback"}</button>
        {!rating && <p className="text-xs text-grijs mt-2 text-center">Kies eerst een aantal sterren.</p>}
      </form>
    </div>
  );
}
