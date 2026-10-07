"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Code = {
  id: string;
  code: string;
  type: "procent" | "bedrag" | "gratis";
  waarde: number;
  doel: "alles" | "advertentie" | "opvaller";
  vervalt?: string;
  maxGebruik?: number;
  aantalGebruikt: number;
  actief: boolean;
  notitie?: string;
  aangemaakt: string;
};

function kortingLabel(c: Code): string {
  if (c.type === "gratis") return "Gratis (100%)";
  if (c.type === "procent") return `${c.waarde}% korting`;
  return `€ ${c.waarde.toLocaleString("nl-NL")} eraf`;
}
const DOEL_LABEL: Record<Code["doel"], string> = {
  alles: "Advertenties + opvallers",
  advertentie: "Alleen advertenties",
  opvaller: "Alleen opvallers",
};

export function KortingscodeBeheer({ codes }: { codes: Code[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "procent",
    waarde: "10",
    doel: "alles",
    vervalt: "",
    maxGebruik: "",
    notitie: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function maak() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/beheer/kortingscodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actie: "maak",
        code: form.code,
        type: form.type,
        waarde: Number(form.waarde) || 0,
        doel: form.doel,
        vervalt: form.vervalt || undefined,
        maxGebruik: form.maxGebruik || undefined,
        notitie: form.notitie || undefined,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && d.ok) {
      setMsg({ ok: true, text: `✓ Code ${d.code.code} aangemaakt.` });
      setForm((f) => ({ ...f, code: "", notitie: "", maxGebruik: "" }));
      router.refresh();
    } else {
      setMsg({ ok: false, text: d.error || "Aanmaken mislukt." });
    }
  }

  async function toggle(id: string) {
    setBusy(true);
    await fetch("/api/beheer/kortingscodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actie: "toggle", id }),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-4">
        <h3 className="font-semibold mb-1">Nieuwe code</h3>
        <p className="text-sm text-grijs mb-3">
          Maak een kortings- of cadeaucode. Een <b>gratis</b>-code (100%) geef je weg, bijvoorbeeld bij een
          Instagram-giveaway — de winnaar plaatst er kosteloos een woning of opvaller mee.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Code</label>
            <input
              className="field uppercase"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="BV. WELKOM10 of GIVEAWAY"
            />
          </div>
          <div>
            <label className="label">Soort korting</label>
            <select className="field" value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="procent">Procent (%)</option>
              <option value="bedrag">Vast bedrag (€)</option>
              <option value="gratis">Gratis (100%)</option>
            </select>
          </div>
          {form.type !== "gratis" && (
            <div>
              <label className="label">{form.type === "procent" ? "Percentage" : "Bedrag in €"}</label>
              <input
                className="field"
                type="number"
                min="1"
                value={form.waarde}
                onChange={(e) => set("waarde", e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label">Geldig voor</label>
            <select className="field" value={form.doel} onChange={(e) => set("doel", e.target.value)}>
              <option value="alles">Advertenties + opvallers</option>
              <option value="advertentie">Alleen advertenties</option>
              <option value="opvaller">Alleen opvallers</option>
            </select>
          </div>
          <div>
            <label className="label">Vervalt op (optioneel)</label>
            <input className="field" type="date" value={form.vervalt} onChange={(e) => set("vervalt", e.target.value)} />
          </div>
          <div>
            <label className="label">Max. aantal keer (optioneel)</label>
            <input
              className="field"
              type="number"
              min="1"
              value={form.maxGebruik}
              onChange={(e) => set("maxGebruik", e.target.value)}
              placeholder="leeg = ongelimiteerd"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notitie (optioneel, alleen voor beheer)</label>
            <input
              className="field"
              value={form.notitie}
              onChange={(e) => set("notitie", e.target.value)}
              placeholder="bv. IG-giveaway maart"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={maak} disabled={busy || !form.code} className="btn text-sm">
            {busy ? "Bezig…" : "Maak code"}
          </button>
          {msg && <span className={`text-sm ${msg.ok ? "text-bosgroen-dk" : "text-oranje-dk"}`}>{msg.text}</span>}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Bestaande codes ({codes.length})</h3>
        {codes.length === 0 ? (
          <p className="text-sm text-grijs">Nog geen codes. Maak er hierboven één aan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-grijs border-b border-lijn">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Korting</th>
                  <th className="py-2 pr-3">Geldig voor</th>
                  <th className="py-2 pr-3">Gebruikt</th>
                  <th className="py-2 pr-3">Vervalt</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-b border-lijn/60">
                    <td className="py-2 pr-3 font-mono font-semibold">{c.code}</td>
                    <td className="py-2 pr-3">{kortingLabel(c)}</td>
                    <td className="py-2 pr-3">{DOEL_LABEL[c.doel]}</td>
                    <td className="py-2 pr-3">
                      {c.aantalGebruikt}
                      {c.maxGebruik ? ` / ${c.maxGebruik}` : ""}
                    </td>
                    <td className="py-2 pr-3">{c.vervalt ? new Date(c.vervalt).toLocaleDateString("nl-NL") : "—"}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.actief ? "bg-bosgroen/10 text-bosgroen-dk" : "bg-grijs/15 text-grijs"
                        }`}
                      >
                        {c.actief ? "actief" : "uit"}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => toggle(c.id)} disabled={busy} className="btn btn-ghost text-xs">
                        {c.actief ? "Zet uit" : "Zet aan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
