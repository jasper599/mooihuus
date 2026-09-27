"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";

export function LeadForm({ listingId, zakelijk = false }: { listingId: string; zakelijk?: boolean }) {
  const t = useT();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fout, setFout] = useState(false);
  const [form, setForm] = useState({ naam: "", email: "", telefoon: "", bericht: "", bedrijf: "" });
  const [ts] = useState(() => Date.now());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFout(false);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ...form, ts }),
      });
      if (!res.ok) throw new Error("mislukt");
      setSent(true);
    } catch {
      setFout(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-[#EAF4EC] border border-[#CADFCF] rounded-xl p-3 text-sm text-bosgroen-dk">
        {t(zakelijk ? "listing.sentZakelijk" : "listing.sent")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {/* Honeypot: onzichtbaar voor mensen, bots vullen het wél in. */}
      <input type="text" name="bedrijf" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.bedrijf} onChange={(e) => setForm({ ...form, bedrijf: e.target.value })} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
      <input required className="field" placeholder={t("listing.name")} value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} />
      <input required type="email" className="field" placeholder={t("listing.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="tel" className="field" placeholder="Telefoonnummer" value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />
      <textarea required className="field min-h-[90px]" placeholder={t("listing.msg")} value={form.bericht} onChange={(e) => setForm({ ...form, bericht: e.target.value })} />
      {fout && <div className="rounded-xl bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk p-2.5 text-sm">Er ging iets mis bij het versturen. Probeer het opnieuw, of mail direct naar info@mooihuus.nl.</div>}
      <button className="btn w-full" disabled={loading}>{loading ? "Versturen…" : t("listing.send")}</button>
    </form>
  );
}
