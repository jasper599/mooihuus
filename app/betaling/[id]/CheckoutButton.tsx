"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutButton({ paymentId, bedrag }: { paymentId: string; bedrag: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fout, setFout] = useState("");

  async function betaal() {
    setBusy(true);
    setFout("");
    try {
      const r = await fetch(`/api/betaling/${paymentId}/voltooien`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
        return;
      }
      if (!r.ok) setFout(d.error || "Betalen lukt even niet. Probeer het later opnieuw.");
      router.refresh();
    } catch {
      setFout("Betalen lukt even niet. Controleer je internetverbinding en probeer het opnieuw.");
    }
    setBusy(false);
  }

  return (
    <>
      <button onClick={betaal} disabled={busy} className="btn w-full">
        {busy ? "Even geduld…" : `Betaal ${bedrag} met iDEAL`}
      </button>
      {fout && <p className="text-sm text-red-700 mt-2 text-center">{fout}</p>}
    </>
  );
}
