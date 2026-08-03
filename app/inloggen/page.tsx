"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Inloggen() {
  const router = useRouter();
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
      <p className="text-grijs mb-5">Welkom terug bij Mooihuus.</p>
      <form onSubmit={submit} className="card space-y-1">
        {error && <div className="bg-[#FBEEE4] border border-[#F0D6C1] text-oranje-dk rounded-xl p-3 text-sm mb-2">{error}</div>}
        <label className="label">E-mail</label>
        <input type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <label className="label">Wachtwoord</label>
        <input type="password" className="field" value={form.wachtwoord} onChange={(e) => setForm({ ...form, wachtwoord: e.target.value })} required />
        <button className="btn w-full mt-4" disabled={busy}>{busy ? "Bezig…" : "Inloggen"}</button>
      </form>
      <div className="card mt-4 text-sm text-grijs">
        <div className="font-semibold text-inkt mb-1">Demo-accounts</div>
        Eigenaar: <b>anouk@example.nl</b> / welkom123<br />
        Beheer: <b>beheer@mooihuus.nl</b> / beheer123
      </div>
      <p className="text-sm text-grijs mt-4 text-center">
        Nog geen account? <Link href="/registreren" className="text-bosgroen font-semibold">Registreren</Link>
      </p>
    </div>
  );
}
