import Link from "next/link";
import { getSocialPosts, getListing, getListings } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Net op Instagram — Mooihuus",
  description: "De woningen die we net op onze Instagram deelden. Klik door naar de woning die je zocht.",
};

export default function InstaPage() {
  // Woningen in de volgorde van onze Instagram-posts (nieuwste bovenaan), ontdubbeld.
  const gezien = new Set<string>();
  const woningen: Listing[] = [];
  for (const s of getSocialPosts().slice().sort((a, b) => String(b.aangemaakt).localeCompare(String(a.aangemaakt)))) {
    if (gezien.has(s.listingId)) continue;
    const l = getListing(s.listingId);
    if (l && l.status === "live") {
      woningen.push(l);
      gezien.add(s.listingId);
    }
    if (woningen.length >= 18) break;
  }
  // Te weinig posts? Vul aan met recente, live woningen (uitgelicht eerst).
  if (woningen.length < 6) {
    const extra = getListings()
      .filter((l) => l.status === "live" && !gezien.has(l.id))
      .sort((a, b) => (b.uitgelicht ? 1 : 0) - (a.uitgelicht ? 1 : 0) || String(b.aangemaakt).localeCompare(String(a.aangemaakt)));
    for (const l of extra) {
      woningen.push(l);
      gezien.add(l.id);
      if (woningen.length >= 9) break;
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-7">
        <div className="inline-flex items-center gap-2 bg-bosgroen/10 text-bosgroen-dk rounded-full px-3 py-1 text-sm font-semibold">
          📸 Via onze Instagram
        </div>
        <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk mt-3">Welkom! Dit zocht je waarschijnlijk</h1>
        <p className="text-grijs mt-2 max-w-xl mx-auto">
          De woningen die we net op Instagram deelden staan hieronder — de nieuwste bovenaan. Klik door voor alle foto&rsquo;s,
          de plattegrond en de details.
        </p>
      </div>

      {woningen.length === 0 ? (
        <div className="text-center text-grijs py-10">
          Er staan nu even geen woningen klaar.{" "}
          <Link href="/aanbod" className="underline text-bosgroen-dk">
            Bekijk het volledige aanbod →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {woningen.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/aanbod" className="btn">
              Bekijk al het aanbod →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
