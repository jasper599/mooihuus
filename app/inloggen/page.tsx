"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Type = "particulier" | "zakelijk";

export default function Inloggen() {
  const router = useRouter();
  const [type, setType] = useState<Type>("particulier");
  const [form, setForm] = useState({ email: "", wachtwoord: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", {
      email: form.email,
      password: form.wachtwoord,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError("E-mail of wachtwoord klopt niet.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Inloggen</h1>
      <p className="text-grijs mb-4">Welkom terug bij Mooihuus.</p>

      {/* Particulier of bedrijf */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["particulier", "zakelijk"] as Type[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl border p-3 text-left ${type === t ? "border-bosgroen bg-[#EAF4EC]" : "border-lijn bg-white"}`}
          >
            <div className="font-display font-bold text-bosgroen-dk">{t === "particulier" ? "Particulier" : "Bedrijf"}</div>
            <div className="text-xs text-grijs">{t === "particulier" ? "Woning zoeken of plaatsen" : "Makelaar of organisatie"}</div>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="card space-y-1">
        {error && <div className="bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk rounded-xl p-3 text-sm mb-2">{error}</div>}
        <label className="label">E-mail</label>
        <input type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <label className="label">Wachtwoord</label>
        <input type="password" className="field" value={form.wachtwoord} onChange={(e) => setForm({ ...form, wachtwoord: e.target.value })} required />
        <button className="btn w-full mt-4" disabled={busy}>{busy ? "Bezig…" : "Inloggen"}</button>
        <div className="text-center mt-2">
          <Link href="/wachtwoord-vergeten" className="text-sm text-grijs hover:text-bosgroen">Wachtwoord vergeten?</Link>
        </div>
      </form>
      <p className="text-sm text-grijs mt-4 text-center">
        <Link href="/zoeker" className="text-bosgroen font-semibold">Woning zoeken? Zet een alert</Link>
      </p>
      <p className="text-sm text-grijs mt-2 text-center">
        Nog geen account?{" "}
        <Link href={`/registreren?type=${type}`} className="text-bosgroen font-semibold">
          {type === "zakelijk" ? "Registreer als bedrijf" : "Registreer als particulier"}
        </Link>
      </p>
    </div>
  );
}
