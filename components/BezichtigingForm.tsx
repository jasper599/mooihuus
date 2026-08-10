"use client";

import { useState } from "react";
import { useT } from "./I18nProvider";

const TIJDEN = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "in overleg"];

export function BezichtigingForm({ listingId }: { listingId: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ naam: "", email: "", datum: "", tijd: "10:00", bericht: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const res = await fetch("/api/bezichtiging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, ...f }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d.error || "Er ging iets mis."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-[#EAF4EC] border border-[#CADFCF] rounded-xl p-3 text-sm text-bosgroen-dk">
        ✓ {t("bez.verstuurd")}
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost w-full text-sm">📅 {t("bez.plannen")}</button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="font-display font-bold text-bosgroen-dk text-sm">{t("bez.plannen")}</div>
      {err && <div className="text-sm text-oranje-dk">{err}</div>}
      <input required className="field" placeholder={t("bez.naam")} value={f.naam} onChange={(e) => set("naam", e.target.value)} />
      <input required type="email" className="field" placeholder={t("bez.email")} value={f.email} onChange={(e) => set("email", e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input required type="date" className="field" value={f.datum} onChange={(e) => set("datum", e.target.value)} />
        <select className="field" value={f.tijd} onChange={(e) => set("tijd", e.target.value)}>
          {TIJDEN.map((tijd) => <option key={tijd} value={tijd}>{tijd === "in overleg" ? t("bez.overleg") : tijd}</option>)}
        </select>
      </div>
      <textarea className="field min-h-[70px]" placeholder={t("bez.toelichting")} value={f.bericht} onChange={(e) => set("bericht", e.target.value)} />
      <button className="btn w-full" disabled={busy}>{busy ? t("form.versturen") : t("bez.verstuurVerzoek")}</button>
      <p className="text-xs text-grijs">
        {t("bez.let")}
      </p>
    </form>
  );
}
