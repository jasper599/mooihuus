"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function Afmelden() {
  const params = useSearchParams();
  const email = params.get("e") || "";
  const [status, setStatus] = useState<"idle" | "busy" | "ok">("idle");

  useEffect(() => {
    if (!email) return;
    setStatus("busy");
    fetch("/api/nieuwsbrief/afmelden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).finally(() => setStatus("ok"));
  }, [email]);

  return (
    <div className="max-w-md mx-auto text-center py-8">
      <div className="text-5xl mb-3">👋</div>
      <h1 className="font-display font-extrabold text-2xl text-bosgroen-dk">
        {status === "ok" ? "Je bent afgemeld" : "Bezig met afmelden…"}
      </h1>
      <p className="text-grijs mt-2">
        {email ? `${email} ontvangt geen nieuwsbrief meer van Mooihuus.` : "Geen adres opgegeven."}
      </p>
      <div className="mt-5"><Link href="/" className="btn btn-green">Terug naar Mooihuus</Link></div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-grijs">Even geduld…</div>}>
      <Afmelden />
    </Suspense>
  );
}
