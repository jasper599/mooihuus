"use client";

import { useState } from "react";

export function MakelaarFactuurKnop({ ownerId }: { ownerId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [bedrag, setBedrag] = useState("");
  const [omschrijving, setOmschrijving] = useState("Eenmalige advertentie op Mooihuus");
  const [btw, setBtw] = useState(true);
  const [mailen, setMailen] = useState(false);
  const [link, setLink] = useState("");

  // Losse factuur met eigen bedrag → maakt een iDEAL-betaallink.
  async function aanmaken() {
    if (!(Number(bedrag) > 0)) { setMsg({ ok: false, text: "Vul een bedrag in." }); return; }
    setBusy(true); setMsg(null); setLink("");
    const res = await fetch("/api/beheer/factuur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, bedrag: Number(bedrag), btw, omschrijving, mailen }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setLink(d.betaalUrl || "");
      setMsg({ ok: true, text: `✓ Factuur ${d.factuurnummer} — € ${Number(d.bedrag).toFixed(2)}${mailen ? " (gemaild)" : ""}` });
    } else setMsg({ ok: false, text: d.reden || d.error || "Mislukt." });
  }

  // Automatische factuur op basis van feed-objecten (bestaande flow).
  async function autoFactuur() {
    setBusy(true); setMsg(null); setLink("");
    const res = await fetch("/api/beheer/factuur", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setMsg({ ok: true, text: `✓ Factuur ${d.factuurnummer}: ${d.aantal} objecten. Betaallink gemaild.` });
    else setMsg({ ok: false, text: d.reden || d.error || "Mislukt." });
  }

  async function rapport() {
    setBusy(true); setMsg(null); setLink("");
    const res = await fetch("/api/beheer/maandrapport", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: `✓ Maandrapport gemaild (${d.aantal} woningen).` } : { ok: false, text: d.reden || d.error || "Mislukt." });
  }

  const totaal = Number(bedrag) > 0 ? (btw ? Number(bedrag) * 1.21 : Number(bedrag)) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setOpen((o) => !o)} className="btn btn-ghost text-xs py-1 px-2">Factuur aanmaken</button>
        <button onClick={autoFactuur} disabled={busy} className="btn btn-ghost text-xs py-1 px-2">{busy ? "…" : "Auto-factuur"}</button>
        <button onClick={rapport} disabled={busy} className="btn btn-ghost text-xs py-1 px-2">{busy ? "…" : "Rapport"}</button>
      </div>

      {open && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-lijn p-2 bg-white mt-1">
          <input className="field text-xs" type="number" min="0" step="0.01" placeholder="Bedrag excl. btw (bijv. 250)" value={bedrag} onChange={(e) => setBedrag(e.target.value)} />
          <input className="field text-xs" placeholder="Omschrijving" value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} />
          <label className="text-xs flex items-center gap-1.5 text-inkt"><input type="checkbox" checked={btw} onChange={(e) => setBtw(e.target.checked)} /> 21% btw toevoegen</label>
          <label className="text-xs flex items-center gap-1.5 text-inkt"><input type="checkbox" checked={mailen} onChange={(e) => setMailen(e.target.checked)} /> Factuur + link e-mailen naar profiel</label>
          {totaal > 0 && <div className="text-xs text-grijs">Totaal te betalen: <b className="text-bosgroen-dk">€ {totaal.toFixed(2)}</b></div>}
          <button onClick={aanmaken} disabled={busy} className="btn text-xs py-1">{busy ? "Bezig…" : "Maak betaallink"}</button>
        </div>
      )}

      {msg && <div className={`text-xs ${msg.ok ? "text-bosgroen-dk" : "text-oranje-dk"}`}>{msg.text}</div>}
      {link && (
        <div className="text-xs flex items-start gap-2">
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-bosgroen underline break-all flex-1">{link}</a>
          <button type="button" onClick={() => navigator.clipboard?.writeText(link)} className="text-oranje-dk font-semibold whitespace-nowrap">kopieer</button>
        </div>
      )}
    </div>
  );
}
