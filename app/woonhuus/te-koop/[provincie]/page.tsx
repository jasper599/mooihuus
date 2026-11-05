import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { PROVINCIES, provincieSlug, provincieVanSlug } from "@/lib/provincies";
import { WOONHUUS_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { provincie: string } }): Promise<Metadata> {
  const prov = provincieVanSlug(params.provincie);
  if (!prov) return { title: "Niet gevonden" };
  const n = getLiveListings("woonhuis").filter((l) => l.doel === "koop" && l.provincie === prov).length;
  const title = `Huis te koop in ${prov}: ${n} ${n === 1 ? "woning" : "woningen"}`;
  const description = `Bekijk ${n} koopwoningen in ${prov} op Woonhuus.nl, van makelaars en particulieren.`;
  return {
    title,
    description,
    alternates: { canonical: `/te-koop/${params.provincie}` },
    openGraph: { title, description, url: `${WOONHUUS_URL}/te-koop/${params.provincie}`, type: "website" },
  };
}

export default function WoonhuusProvincie({ params }: { params: { provincie: string } }) {
  const prov = provincieVanSlug(params.provincie);
  if (!prov) return notFound();
  const woningen = getLiveListings("woonhuis")
    .filter((l) => l.doel === "koop" && l.provincie === prov)
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined }));
  return (
    <div>
      <nav className="text-sm text-grijs mb-2"><Link href="/te-koop" className="hover:underline">Huis te koop</Link> · {prov}</nav>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Huis te koop in {prov}</h1>
      <div className="text-sm text-grijs mt-3 mb-5">{woningen.length} {woningen.length === 1 ? "woning" : "woningen"} te koop in {prov}.</div>
      {woningen.length === 0 ? (
        <div className="card text-grijs">Op dit moment staan er geen koopwoningen in {prov} op Woonhuus.nl.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {woningen.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
      <div className="mt-10">
        <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-2">Andere provincies</h2>
        <div className="flex flex-wrap gap-2">
          {PROVINCIES.filter((p) => p !== prov).map((p) => (
            <Link key={p} href={`/te-koop/${provincieSlug(p)}`} className="pill hover:bg-zand">{p}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
