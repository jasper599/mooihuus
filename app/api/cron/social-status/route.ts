import { NextResponse } from "next/server";
import { getSocialPosts, getListing, getPayments } from "@/lib/db";
import { metricoolEnabled } from "@/lib/metricool";
import { instagramEnabled } from "@/lib/instagram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TIJDELIJK leesvenster om de social-wachtrij te controleren. Na gebruik verwijderen.
// Beveiligd met een korte wegwerp-sleutel in de URL.
const KEY = "mh-diag-social-7f3a9c2e5b1d4860ab";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (key !== KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const posts = getSocialPosts()
    .slice()
    .sort((a, b) => String(b.aangemaakt).localeCompare(String(a.aangemaakt)))
    .slice(0, 25)
    .map((s) => {
      const l = getListing(s.listingId);
      const p = s.paymentId ? getPayments().find((x) => x.id === s.paymentId) : undefined;
      return {
        id: s.id,
        woning: l?.titel ?? "—",
        status: s.status,
        prioriteit: s.prioriteit ?? false,
        bron: s.bron,
        ingeplandVoor: s.ingeplandVoor ?? null,
        geplaatstOp: (s as any).geplaatstOp ?? null,
        metricoolId: s.metricoolId ?? null,
        notitie: s.notitie ?? null,
        fotoUrl: s.fotoUrl ?? l?.fotos?.[0] ?? null,
        betaling: p ? { id: p.id, status: p.status, bedrag: p.bedrag, soort: p.soort } : null,
        aangemaakt: s.aangemaakt,
      };
    });
  return NextResponse.json({
    ok: true,
    nu: new Date().toISOString(),
    metricoolEnabled: metricoolEnabled(),
    instagramEnabled: instagramEnabled(),
    aantal: posts.length,
    posts,
  });
}
