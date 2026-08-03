"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutButton({ paymentId, bedrag }: { paymentId: string; bedrag: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function betaal() {
    setBusy(true);
    await fetch(`/api/betaling/${paymentId}/voltooien`, { method: "POST" });
    router.refresh();
  }

  return (
    <button onClick={betaal} disabled={busy} className="btn w-full">
      {busy ? "Betaling verwerken…" : `Betaal ${bedrag} met iDEAL`}
    </button>
  );
}
