"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Type = "particulier" | "zakelijk";

export default function Registreren() {
  const router = useRouter();
  const [type, setType] = useState<Type>("particulier");
  const [form, setForm] = useState({ naam: "", email: "", wachtwoord: "", bedrijfsnaam: "", kvk: "", btw: "", telefoon: "", adres: "", postcode: "", plaats: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Voorselecteren op basis van ?type=zakelijk (deeplink vanaf inloggen/knoppen).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("type");
    if (p === "zakelijk" || p === "particulier") setType(p);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Er ging iets mis.");
      setBusy(false);
      return;
    }
    await signIn("credentials", { email: form.email, password: form.wachtwoord, redirect: false });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Maak je account</h1>
      <p className="text-grijs mb-5">Gratis account. Betalen doe je pas per advertentie.</p>

      {/* Accounttype */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["particulier", "zakelijk"] as Type[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl border p-3 text-left ${
              type === t ? "border-bosgroen bg-[#EAF4EC]" : "border-lijn bg-white"
            }`}
          >
            <div className="font-display font-bold text-bosgroen-dk">{t === "particulier" ? "Particulier" : "Bedrijf"}</div>
            <div className="text-xs text-grijs">{t === "particulier" ? "Eén of enkele woningen" : "Makelaar of organisatie"}</div>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="card space-y-1">
        {error && <div className="bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk rounded-xl p-3 text-sm mb-2">{error}</div>}

        {type === "zakelijk" && (
          <>
            <label className="label">Bedrijfsnaam</label>
            <input className="field" value={form.bedrijfsnaam} onChange={(e) => setForm({ ...form, bedrijfsnaam: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">KvK-nummer</label><input className="field" value={form.kvk} onChange={(e) => setForm({ ...form, kvk: e.target.value })} required /></div>
              <div><label className="label">Btw-nummer</label><input className="field" value={form.btw} onChange={(e) => setForm({ ...form, btw: e.target.value })} placeholder="NL000000000B00" required /></div>
            </div>
            <label className="label">Telefoonnummer</label>
            <input className="field" value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} required />
            <label className="label">Adres <span className="text-grijs font-normal">(optioneel)</span></label>
            <input className="field" value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} placeholder="Straat en huisnummer" />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Postcode <span className="text-grijs font-normal">(optioneel)</span></label><input className="field" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} /></div>
              <div><label className="label">Plaats <span className="text-grijs font-normal">(optioneel)</span></label><input className="field" value={form.plaats} onChange={(e) => setForm({ ...form, plaats: e.target.value })} /></div>
            </div>
          </>
        )}

        <label className="label">{type === "zakelijk" ? "Naam contactpersoon" : "Naam"}</label>
        <input className="field" value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} required />
        <label className="label">E-mail</label>
        <input type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <label className="label">Wachtwoord</label>
        <input type="password" className="field" value={form.wachtwoord} onChange={(e) => setForm({ ...form, wachtwoord: e.target.value })} required />
        <button className="btn w-full mt-4" disabled={busy}>{busy ? "Bezig…" : "Account aanmaken"}</button>
      </form>
      <p className="text-sm text-grijs mt-4 text-center">
        Al een account? <Link href="/inloggen" className="text-bosgroen font-semibold">Inloggen</Link>
      </p>
    </div>
  );
}
