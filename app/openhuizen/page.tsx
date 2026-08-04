import type { Metadata } from "next";
import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { openhuisInfo } from "@/lib/format";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Open huizen — recreatiewoningen | Mooihuus",
  description: "Bekijk de aankomende open huizen van recreatiewoningen op Mooihuus. Loop binnen en beleef je toekomstige vakantiewoning zelf.",
  alternates: { canonical: "/openhuizen" },
};

export default function OpenhuizenPage() {
  const woningen = getLiveListings()
    .map((l) => ({ l, oh: openhuisInfo(l) }))
    .filter((x) => x.oh && x.oh.aankomend)
    .sort((a, b) => a.oh!.datum.localeCompare(b.oh!.datum))
    .map((x) => ({ ...x.l, fotos: x.l.fotos && x.l.fotos.length ? [x.l.fotos[0]] : undefined }));

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Open huizen 🏠</h1>
      <p className="text-grijs mt-2 max-w-2xl mb-6">Aankomende open dagen bij recreatiewoningen. Loop binnen, kijk rond en beleef je toekomstige vakantiewoning zelf.</p>

      {woningen.length === 0 ? (
        <div className="card text-grijs">Op dit moment staan er geen open huizen gepland. <Link href="/zoeker" className="text-bosgroen font-semibold">Zet een woning-alert →</Link> dan mis je er geen.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {woningen.map((l) => {
            const oh = openhuisInfo(l)!;
            return (
              <div key={l.id}>
                <div className="text-sm font-display font-bold text-oranje-dk mb-1">🏠 {oh.label}{oh.van && oh.tot ? ` · ${oh.van}–${oh.tot}` : ""}</div>
                <ListingCard listing={l} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
