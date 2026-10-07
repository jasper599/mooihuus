"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PromoteButtons({ listingId, opvaller, prijs }: { listingId: string; opvaller: string; prijs: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  async function koop() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/promoten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, opvaller, code: code.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Er ging iets mis.");
        setBusy(false);
        return;
      }
      if (data.extern) {
        window.location.href = data.redirect;
      } else {
        router.push(data.redirect);
      }
    } catch {
      setErr("Er ging iets mis. Probeer het opnieuw.");
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={koop} disabled={busy} className="btn w-full text-sm">
        {busy ? "Bezig…" : `Kies · ${prijs}`}
      </button>
      {showCode ? (
        <input
          className="field mt-2 text-sm uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Kortingscode"
        />
      ) : (
        <button type="button" onClick={() => setShowCode(true)} className="mt-2 text-xs text-bosgroen-dk underline">
          Kortingscode?
        </button>
      )}
      {err && <p className="text-xs text-oranje-dk mt-2">{err}</p>}
    </>
  );
}
