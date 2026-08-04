"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";

export function BedrijfsgegevensForm({ user }: { user: User }) {
  const router = useRouter();
  const [f, setF] = useState({
    naam: user.naam || "", bedrijfsnaam: user.bedrijfsnaam || "", kvk: user.kvk || "", btw: user.btw || "",
    telefoon: user.telefoon || "", adres: user.adres || "", postcode: user.postcode || "", plaats: user.plaats || "",
    iban: user.iban || "", factuurEmail: user.factuurEmail || "", website: user.website || "",
    standaardPakket: user.standaardPakket || "Basis",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const zak = user.type === "zakelijk";

  async function opslaan(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch("/api/account/bedrijf", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "✓ Opgeslagen." } : { ok: false, text: "Opslaan mislukt." });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={opslaan} className="space-y-2">
      {msg && <div className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-[#EAF4EC] border border-[#CADFCF] text-bosgroen-dk" : "bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk"}`}>{msg.text}</div>}
      {zak && <div><label className="label">Bedrijfsnaam</label><input className="field" value={f.bedrijfsnaam} onChange={(e) => set("bedrijfsnaam", e.target.value)} /></div>}
      <div><label className="label">{zak ? "Naam contactpersoon" : "Naam"}</label><input className="field" value={f.naam} onChange={(e) => set("naam", e.target.value)} /></div>
      {zak && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">KvK-nummer</label><input className="field" value={f.kvk} onChange={(e) => set("kvk", e.target.value)} /></div>
            <div><label className="label">Btw-nummer</label><input className="field" value={f.btw} onChange={(e) => set("btw", e.target.value)} /></div>
          </div>
          <div><label className="label">Telefoonnummer</label><input className="field" value={f.telefoon} onChange={(e) => set("telefoon", e.target.value)} /></div>
          <div><label className="label">Adres</label><input className="field" value={f.adres} onChange={(e) => set("adres", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Postcode</label><input className="field" value={f.postcode} onChange={(e) => set("postcode", e.target.value)} /></div>
            <div><label className="label">Plaats</label><input className="field" value={f.plaats} onChange={(e) => set("plaats", e.target.value)} /></div>
          </div>
          <div><label className="label">IBAN</label><input className="field" value={f.iban} onChange={(e) => set("iban", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Factuur-e-mail</label><input type="email" className="field" value={f.factuurEmail} onChange={(e) => set("factuurEmail", e.target.value)} /></div>
            <div><label className="label">Website</label><input className="field" value={f.website} onChange={(e) => set("website", e.target.value)} /></div>
          </div>
          <div>
            <label className="label">Standaardpakket voor doorgezette woningen</label>
            <select className="field" value={f.standaardPakket} onChange={(e) => set("standaardPakket", e.target.value)}>
              <option value="Basis">Basis — € 25 per object</option>
              <option value="Plus">Plus — € 49 per object</option>
              <option value="Premium">Premium — € 79 per object</option>
            </select>
            <p className="text-xs text-grijs mt-1">Dit pakket geldt voor woningen die automatisch via je CRM (Kolibri/Realworks) binnenkomen. Volumekorting wordt automatisch toegepast.</p>
          </div>
        </>
      )}
      <button className="btn w-full mt-2" disabled={busy}>{busy ? "Opslaan…" : "Gegevens opslaan"}</button>
    </form>
  );
}
