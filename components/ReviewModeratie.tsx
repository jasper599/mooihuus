"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewModeratie({ id, goedgekeurd }: { id: string; goedgekeurd: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function doe(action: "toggle" | "delete") {
    if (action === "delete" && !confirm("Deze beoordeling definitief verwijderen?")) return;
    setBusy(true);
    await fetch("/api/beheer/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => doe("toggle")} disabled={busy} className="btn btn-ghost text-xs py-1 px-2">
        {goedgekeurd ? "Verbergen" : "Goedkeuren"}
      </button>
      <button onClick={() => doe("delete")} disabled={busy} className="text-xs py-1 px-2 text-oranje-dk hover:underline">
        Verwijderen
      </button>
    </div>
  );
}
