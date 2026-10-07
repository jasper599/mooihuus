"use client";

import { useState } from "react";

export function NieuwsbriefForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [bedrijf, setBedrijf] = useState(""); // honeypot — hoort leeg te blijven
  const [ts] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "err">("idle");

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    const res = await fetch("/api/nieuwsbrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, bedrijf, ts }),
    });
    setStatus(res.ok ? "ok" : "err");
  }

  if (status === "ok") {
    return <div className={`text-sm ${compact ? "text-salie-lt" : "text-bosgroen-dk"}`}>✓ Gelukt! Je ontvangt vanaf nu onze tips en nieuwe woningen.</div>;
  }

  return (
    <form onSubmit={verstuur} className="flex gap-2 flex-wrap">
      {/* Honeypot: verborgen voor mensen, vaak ingevuld door bots. */}
      <input
        type="text"
        name="bedrijf"
        tabIndex={-1}
        autoComplete="off"
        value={bedrijf}
        onChange={(e) => setBedrijf(e.target.value)}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Je e-mailadres"
        className="field flex-1 min-w-[180px]"
        aria-label="E-mailadres voor de nieuwsbrief"
      />
      <button className="btn btn-green" disabled={status === "busy"}>
        {status === "busy" ? "Bezig…" : "Aanmelden"}
      </button>
      {status === "err" && <div className="text-sm text-oranje-dk w-full">Vul een geldig e-mailadres in.</div>}
    </form>
  );
}
