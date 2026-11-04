"use client";

import { useState } from "react";

// Beheer: per woning wisselen tussen Mooihuus (recreatie) en Woonhuus (woonhuis).
export function CategorieKnop({ id, categorie, handmatig }: { id: string; categorie: "recreatie" | "woonhuis"; handmatig?: boolean }) {
  const [cat, setCat] = useState(categorie);
  const [hand, setHand] = useState(!!handmatig);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  async function wissel() {
    const nieuw = cat === "woonhuis" ? "recreatie" : "woonhuis";
    setBezig(true);
    setFout("");
    try {
      const r = await fetch("/api/beheer/categorie", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, categorie: nieuw }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Mislukt");
      setCat(nieuw);
      setHand(true);
    } catch (e: any) {
      setFout(e?.message || "Mislukt");
    } finally {
      setBezig(false);
    }
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`pill ${cat === "woonhuis" ? "bg-[#D5E0EC] text-[#1E3A5F]" : ""}`} title={hand ? "Handmatig gekozen" : "Automatisch bepaald"}>
        {cat === "woonhuis" ? "Woonhuus" : "Mooihuus"}{hand ? " ✎" : ""}
      </span>
      <button type="button" onClick={wissel} disabled={bezig} className="text-xs text-bosgroen underline disabled:opacity-50">
        {bezig ? "…" : `naar ${cat === "woonhuis" ? "Mooihuus" : "Woonhuus"}`}
      </button>
      {fout && <span className="text-xs text-oranje-dk">{fout}</span>}
    </span>
  );
}
