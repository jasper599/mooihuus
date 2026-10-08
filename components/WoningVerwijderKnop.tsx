"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Handmatig een (eigen) woning verwijderen vanuit het beheer.
// Twee klikken i.p.v. een pop-up, zodat er nooit per ongeluk iets verdwijnt.
export function WoningVerwijderKnop({ id }: { id: string }) {
  const router = useRouter();
  const [bevestig, setBevestig] = useState(false);
  const [busy, setBusy] = useState(false);
  const [weg, setWeg] = useState(false);

  async function verwijder() {
    setBusy(true);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setWeg(true);
      router.refresh();
    } else {
      alert(d.error || "Verwijderen mislukt.");
      setBevestig(false);
    }
  }

  if (weg) return <span className="text-grijs text-xs">Verwijderd ✓</span>;

  if (!bevestig) {
    return (
      <button onClick={() => setBevestig(true)} className="text-oranje-dk text-xs underline">
        verwijder
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-grijs">zeker?</span>
      <button onClick={verwijder} disabled={busy} className="text-[#8A2E22] text-xs font-semibold underline">
        {busy ? "…" : "ja, verwijder"}
      </button>
      <button onClick={() => setBevestig(false)} className="text-grijs text-xs underline">
        nee
      </button>
    </span>
  );
}
