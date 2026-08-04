import type { Metadata } from "next";
import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { VergelijkClient } from "@/components/VergelijkClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Woningen vergelijken",
  description: "Vergelijk je bewaarde recreatiewoningen naast elkaar op prijs, oppervlakte, personen en meer.",
};

export default function VergelijkenPage() {
  const listings = getLiveListings().map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined }));

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Vergelijken ⚖️</h1>
      <p className="text-grijs mb-6">Je bewaarde woningen naast elkaar. <Link href="/favorieten" className="text-bosgroen font-semibold">Naar favorieten →</Link></p>
      <VergelijkClient listings={listings} />
    </div>
  );
}
