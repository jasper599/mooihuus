"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ListingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function zet(s: string) {
    setBusy(true);
    await fetch(`/api/listings/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (s === "verkocht") {
      router.push(`/enquete?listing=${id}`);
    } else {
      router.refresh();
      setBusy(false);
    }
  }

  async function verwijder() {
    if (!confirm("Weet je zeker dat je deze advertentie definitief verwijdert?")) return;
    setBusy(true);
    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const knop = "text-xs font-display font-semibold rounded-lg px-2.5 py-1.5 border";

  return (
    <div className="flex gap-2 flex-wrap">
      {status === "live" && (
        <>
          <button disabled={busy} onClick={() => zet("verkocht")} className={`${knop} bg-bosgroen text-white border-bosgroen`}>Markeer als verkocht</button>
          <button disabled={busy} onClick={() => zet("offline")} className={`${knop} bg-white text-bosgroen-dk border-salie`}>Offline halen</button>
        </>
      )}
      {status === "verkocht" && (
        <button disabled={busy} onClick={() => zet("live")} className={`${knop} bg-white text-bosgroen-dk border-salie`}>Weer online zetten</button>
      )}
      {status === "offline" && (
        <button disabled={busy} onClick={() => zet("live")} className={`${knop} bg-bosgroen text-white border-bosgroen`}>Weer online zetten</button>
      )}
      <button disabled={busy} onClick={verwijder} className={`${knop} bg-white text-oranje-dk border-[#F0D6C1]`}>Verwijderen</button>
    </div>
  );
}
