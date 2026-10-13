"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Lid = { id: string; email: string; datum: string };

export function NieuwsbriefLeden({ leden }: { leden: Lid[] }) {
  const router = useRouter();
  const [bezig, setBezig] = useState<string>("");
  const [weg, setWeg] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");

  async function verwijder(email: string) {
    if (!confirm(`'${email}' van de nieuwsbrieflijst verwijderen?`)) return;
    setBezig(email); setMsg("");
    try {
      const res = await fetch("/api/beheer/nieuwsbrief/verwijder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setWeg((s) => new Set(s).add(email));
        setMsg(`✓ ${email} verwijderd.`);
        router.refresh();
      } else {
        setMsg(d.error || "Verwijderen mislukt.");
      }
    } catch {
      setMsg("Verwijderen mislukt.");
    } finally {
      setBezig("");
    }
  }

  const zichtbaar = leden.filter((l) => !weg.has(l.email));

  return (
    <div>
      {msg && <div className="text-sm text-bosgroen-dk mb-2">{msg}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-grijs">
              <th className="py-2 pr-3">E-mail</th>
              <th className="py-2 pr-3">Aangemeld</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {zichtbaar.map((l) => (
              <tr key={l.id} className="border-t border-lijn">
                <td className="py-2 pr-3 break-all">{l.email}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{new Date(l.datum).toLocaleDateString("nl-NL")}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => verwijder(l.email)}
                    disabled={bezig === l.email}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    {bezig === l.email ? "…" : "Verwijder"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
