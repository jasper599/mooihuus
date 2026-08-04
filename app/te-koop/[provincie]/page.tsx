import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { PROVINCIES, provincieSlug, provincieVanSlug, provincieIntro } from "@/lib/provincies";
import { COMPANY } from "@/lib/company";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { provincie: string } }): Promise<Metadata> {
  const prov = provincieVanSlug(params.provincie);
  if (!prov) return { title: "Niet gevonden" };
  const n = getLiveListings().filter((l) => l.doel === "koop" && l.provincie === prov).length;
  const title = `Recreatiewoning te koop in ${prov} — ${n} woningen | Mooihuus`;
  const description = `${provincieIntro(prov)} Bekijk ${n} recreatiewoningen te koop in ${prov} op Mooihuus.`;
  return {
    title,
    description,
    alternates: { canonical: `/te-koop/${params.provincie}` },
    openGraph: { title, description, url: `${COMPANY.website}/te-koop/${params.provincie}`, type: "website" },
  };
}

export default function ProvinciePagina({ params }: { params: { provincie: string } }) {
  const prov = provincieVanSlug(params.provincie);
  if (!prov) return notFound();
  const woningen = getLiveListings()
    .filter((l) => l.doel === "koop" && l.provincie === prov)
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Recreatiewoningen te koop in ${prov}`,
    url: `${COMPANY.website}/te-koop/${params.provincie}`,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-grijs mb-2"><Link href="/te-koop" className="hover:underline">Recreatiewoningen te koop</Link> · {prov}</nav>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Recreatiewoning te koop in {prov}</h1>
      <p className="text-grijs mt-2 max-w-2xl">{provincieIntro(prov)}</p>
      <div className="text-sm text-grijs mt-3 mb-5">{woningen.length} {woningen.length === 1 ? "woning" : "woningen"} te koop in {prov}.</div>

      {woningen.length === 0 ? (
        <div className="card text-grijs">Op dit moment staan er geen woningen te koop in {prov}. <Link href="/zoeker" className="text-bosgroen font-semibold">Zet een woning-alert →</Link></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {woningen.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-2">Recreatiewoningen in andere provincies</h2>
        <div className="flex flex-wrap gap-2">
          {PROVINCIES.filter((p) => p !== prov).map((p) => (
            <Link key={p} href={`/te-koop/${provincieSlug(p)}`} className="pill hover:bg-zand">{p}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
