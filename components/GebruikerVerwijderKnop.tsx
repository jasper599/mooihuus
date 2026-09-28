"use client";

import { useState } from "react";

// Verwijderknop voor een profiel in het beheer (bijv. spam-registraties).
// Vraagt eerst om bevestiging en herlaadt de pagina na succes.
export function GebruikerVerwijderKnop({ id, naam }: { id: string; naam: string }) {
  const [busy, setBusy] = useState(false);

  async function verwijder() {
    if (!confirm(`Profiel "${naam || "onbekend"}" definitief verwijderen?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/beheer/gebruiker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(d.error || "Verwijderen mislukt.");
        setBusy(false);
        return;
      }
      location.reload();
    } catch {
      alert("Verwijderen mislukt. Probeer het opnieuw.");
      setBusy(false);
    }
  }

  return (
    <button onClick={verwijder} disabled={busy} className="text-xs text-oranje-dk hover:underline disabled:opacity-50">
      {busy ? "Bezig…" : "🗑 Verwijder"}
    </button>
  );
}
