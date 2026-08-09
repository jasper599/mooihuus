"use client";

import { useState } from "react";

type Post = {
  id: string;
  titel: string;
  status: string;
  prioriteit: boolean;
  bron: string;
  tekst?: string;
  ingeplandVoor?: string;
  notitie?: string;
  aangemaakt: string;
};

const LABEL: Record<string, { txt: string; cls: string }> = {
  wachtrij: { txt: "In wachtrij", cls: "text-oranje-dk" },
  ingepland: { txt: "Ingepland", cls: "text-bosgroen" },
  geplaatst: { txt: "Geplaatst ✓", cls: "text-bosgroen" },
  mislukt: { txt: "Geannuleerd", cls: "text-grijs" },
};

export function SocialWachtrij({ posts, metricool }: { posts: Post[]; metricool: boolean }) {
  const [rows, setRows] = useState(posts);
  const [busy, setBusy] = useState("");

  async function doe(id: string, actie: string) {
    setBusy(id + actie);
    const res = await fetch("/api/beheer/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actie }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy("");
    if (res.ok) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: d.status, ingeplandVoor: d.ingeplandVoor ?? r.ingeplandVoor } : r)));
    } else {
      alert(d.error || "Er ging iets mis.");
    }
  }

  if (rows.length === 0) {
    return <p className="text-grijs text-sm">Nog geen social-posts in de wachtrij. Een betaalde ‘Social spotlight’ verschijnt hier automatisch — met voorrang.</p>;
  }

  return (
    <div>
      <div className={`text-sm mb-3 ${metricool ? "text-bosgroen" : "text-oranje-dk"}`}>
        {metricool
          ? "✓ Metricool gekoppeld — betaalde posts worden automatisch met voorrang ingepland op Instagram."
          : "○ Metricool nog niet gekoppeld. Posts staan met voorrang in de wachtrij; plaats ze handmatig en markeer ze hier als geplaatst. (Stel de METRICOOL_-variabelen in om automatisch in te plannen.)"}
      </div>
      <div className="space-y-2">
        {rows.map((p) => {
          const l = LABEL[p.status] || LABEL.wachtrij;
          return (
            <div key={p.id} className="card flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {p.prioriteit && <span className="pill bg-oranje text-white">Voorrang</span>}
                  <span className="font-display font-semibold text-bosgroen-dk truncate">{p.titel}</span>
                </div>
                <div className="text-xs text-grijs mt-0.5">
                  {p.bron === "bestelling" ? "Betaalde bestelling" : "Handmatig"} · <span className={l.cls}>{l.txt}</span>
                  {p.ingeplandVoor && <> · gepland: {new Date(p.ingeplandVoor).toLocaleString("nl-NL")}</>}
                </div>
                {p.tekst && <div className="text-sm mt-1 text-grijs italic">“{p.tekst}”</div>}
                {p.notitie && <div className="text-xs text-[#8A2E22] mt-1">{p.notitie}</div>}
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {metricool && p.status !== "geplaatst" && (
                  <button onClick={() => doe(p.id, "inplannen")} disabled={!!busy} className="btn btn-ghost text-xs py-1 px-2">
                    {busy === p.id + "inplannen" ? "…" : "Inplannen"}
                  </button>
                )}
                {p.status !== "geplaatst" ? (
                  <button onClick={() => doe(p.id, "geplaatst")} disabled={!!busy} className="btn text-xs py-1 px-2">
                    {busy === p.id + "geplaatst" ? "…" : "Markeer geplaatst"}
                  </button>
                ) : (
                  <button onClick={() => doe(p.id, "wachtrij")} disabled={!!busy} className="text-grijs text-xs underline">
                    terug naar wachtrij
                  </button>
                )}
                {p.status !== "mislukt" && p.status !== "geplaatst" && (
                  <button onClick={() => doe(p.id, "annuleren")} disabled={!!busy} className="text-oranje-dk text-xs underline">
                    annuleren
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
