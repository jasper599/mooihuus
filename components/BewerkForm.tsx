"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";

const PROVINCIES = [
  "Groningen", "Friesland", "Drenthe", "Overijssel", "Flevoland", "Gelderland",
  "Utrecht", "Noord-Holland", "Zuid-Holland", "Zeeland", "Noord-Brabant", "Limburg",
];
const TYPES = ["Bungalow", "Chalet", "Vrijstaand vakantiehuis", "Tiny house", "Recreatiewoning", "Appartement"];

export function BewerkForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [f, setF] = useState({
    titel: listing.titel, type: listing.type, doel: listing.doel, provincie: listing.provincie,
    park: listing.park, personen: String(listing.personen), m2: String(listing.m2),
    prijs: String(listing.prijs), prijsSuffix: listing.prijsSuffix || "", grond: listing.grond || "",
    omschrijving: listing.omschrijving,
  });
  const [fotos, setFotos] = useState<string[]>(listing.fotos || []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setMsg(null);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) setFotos((p) => [...p, data.url]);
      else setMsg({ ok: false, text: data.error || "Uploaden mislukt." });
    }
    setUploading(false);
    e.target.value = "";
  }
  const removeFoto = (url: string) => setFotos((p) => p.filter((u) => u !== url));
  const moveFirst = (url: string) => setFotos((p) => [url, ...p.filter((u) => u !== url)]);

  async function opslaan(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch(`/api/listings/${listing.id}/bewerken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, personen: Number(f.personen), m2: Number(f.m2), prijs: Number(f.prijs), fotos }),
      // prijsSuffix + grond gaan mee in ...f
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg({ ok: false, text: data.error || "Opslaan mislukt." }); return; }
    setMsg({ ok: true, text: "✓ Opgeslagen!" });
    router.refresh();
  }

  return (
    <form onSubmit={opslaan} className="space-y-3">
      {msg && <div className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-[#EAF4EC] border border-[#CADFCF] text-bosgroen-dk" : "bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk"}`}>{msg.text}</div>}

      <div><label className="label">Titel</label><input className="field" value={f.titel} onChange={(e) => set("titel", e.target.value)} /></div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Type</label>
          <select className="field" value={f.type} onChange={(e) => set("type", e.target.value)}>
            {[f.type, ...TYPES.filter((t) => t !== f.type)].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="label">Koop of huur</label>
          <select className="field" value={f.doel} onChange={(e) => set("doel", e.target.value as any)}>
            <option value="koop">Te koop</option><option value="huur">Te huur</option>
          </select>
        </div>
        <div><label className="label">Provincie</label>
          <select className="field" value={f.provincie} onChange={(e) => set("provincie", e.target.value)}>
            {[f.provincie, ...PROVINCIES.filter((p) => p !== f.provincie)].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div><label className="label">Park / locatie</label><input className="field" value={f.park} onChange={(e) => set("park", e.target.value)} /></div>
        <div><label className="label">Aantal personen</label><input type="number" className="field" value={f.personen} onChange={(e) => set("personen", e.target.value)} /></div>
        <div><label className="label">Oppervlakte (m²)</label><input type="number" className="field" value={f.m2} onChange={(e) => set("m2", e.target.value)} /></div>
        <div><label className="label">Prijs (€)</label><input type="number" className="field" value={f.prijs} onChange={(e) => set("prijs", e.target.value)} /></div>
        <div><label className="label">Prijs-toevoeging</label>
          <select className="field" value={f.prijsSuffix} onChange={(e) => set("prijsSuffix", e.target.value)}>
            <option value="">Automatisch (koop → k.k.)</option>
            <option value="k.k.">k.k. (kosten koper)</option>
            <option value="v.o.n.">v.o.n. (vrij op naam)</option>
            <option value="excl. btw">excl. btw</option>
            <option value="per week">per week</option>
            <option value="per maand">per maand</option>
            <option value="geen">Geen toevoeging</option>
          </select>
        </div>
        <div className="sm:col-span-2"><label className="label">Grond</label>
          <select className="field" value={f.grond} onChange={(e) => set("grond", e.target.value)}>
            <option value="">Onbekend / niet tonen</option>
            <option value="Eigen grond">Eigen grond</option>
            <option value="Erfpacht">Erfpacht</option>
            <option value="Huurgrond">Huurgrond</option>
          </select>
        </div>
      </div>

      <div><label className="label">Omschrijving</label><textarea className="field min-h-[140px]" value={f.omschrijving} onChange={(e) => set("omschrijving", e.target.value)} /></div>

      <div>
        <label className="label">Foto's</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {fotos.map((url, i) => (
            <div key={url} className="relative group rounded-lg overflow-hidden border border-lijn">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-20 object-cover" />
              {i === 0 && <span className="absolute top-1 left-1 bg-oranje text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded">hoofdfoto</span>}
              <div className="absolute inset-x-0 bottom-0 flex text-[0.62rem]">
                {i !== 0 && <button type="button" onClick={() => moveFirst(url)} className="flex-1 bg-bosgroen/90 text-white py-0.5">hoofdfoto</button>}
                <button type="button" onClick={() => removeFoto(url)} className="flex-1 bg-oranje/90 text-white py-0.5">verwijderen</button>
              </div>
            </div>
          ))}
        </div>
        <label className="btn btn-ghost text-sm cursor-pointer inline-block">
          {uploading ? "Uploaden…" : "+ Foto's toevoegen"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={upload} disabled={uploading} />
        </label>
        <p className="text-xs text-grijs mt-1">De eerste foto is de hoofdfoto. Max 8 MB per foto.</p>
      </div>

      <button className="btn w-full" disabled={busy || uploading}>{busy ? "Opslaan…" : "Wijzigingen opslaan"}</button>
    </form>
  );
}
