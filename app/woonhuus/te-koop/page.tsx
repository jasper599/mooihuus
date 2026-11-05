import type { Metadata } from "next";
import Link from "next/link";
import { getLiveListings, getPostcodeGeoMap, normaliseerPostcode } from "@/lib/db";
import { PROVINCIES, provincieSlug } from "@/lib/provincies";
import { WoonhuusZoeker } from "@/components/WoonhuusZoeker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Huis te koop in Nederland: alle koopwoningen",
  description: "Zoek koopwoningen in heel Nederland op plaats, postcode en straal: eengezinswoningen, appartementen en starterswoningen, van makelaars en particulieren.",
  alternates: { canonical: "/te-koop" },
};

// Zoekresultaten van Woonhuus.nl: zoekvak met straal, filters en resultaten.
export default function WoonhuusTeKoop({ searchParams }: { searchParams?: { q?: string; straal?: string } }) {
  const live = getLiveListings("woonhuis").filter((l) => l.doel === "koop");
  const listings = live.map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined, omschrijving: "" }));
  const alleGeo = getPostcodeGeoMap();
  const geo: Record<string, [number, number]> = {};
  for (const l of live) {
    const pc = normaliseerPostcode(l.postcode || "");
    if (pc && alleGeo[pc]) geo[pc] = alleGeo[pc];
  }
  const straal = Number(searchParams?.straal || 0);
  const perProv = (p: string) => live.filter((l) => l.provincie === p).length;
  return (
    <div>
      <h1 className="m-0 font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk">Huis te koop</h1>
      <p className="text-grijs mt-2 mb-0">Koopwoningen in heel Nederland, aangeboden door makelaars en particulieren.</p>
      <WoonhuusZoeker
        listings={listings}
        geo={geo}
        initialQ={searchParams?.q ? String(searchParams.q).slice(0, 80) : ""}
        initialStraal={[0, 1, 2, 5, 10, 15, 30, 50].includes(straal) ? straal : 0}
      />
      <section id="provincies" className="mt-14 scroll-mt-20">
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk">Huis te koop per provincie</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROVINCIES.map((p) => (
            <Link key={p} href={`/te-koop/${provincieSlug(p)}`} className="card flex items-center justify-between hover:shadow-md transition-shadow">
              <span className="font-display font-bold text-bosgroen-dk">{p}</span>
              <span className="pill">{perProv(p)} {perProv(p) === 1 ? "woning" : "woningen"}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
