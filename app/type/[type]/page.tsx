import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { WONINGTYPES, typeSlug, typeVanSlug, isType } from "@/lib/woningtypes";
import { PROVINCIES, provincieSlug } from "@/lib/provincies";
import { COMPANY } from "@/lib/company";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { type: string } }): Promise<Metadata> {
  const wt = typeVanSlug(params.type);
  if (!wt) return { title: "Niet gevonden" };
  const n = getLiveListings().filter((l) => l.doel === "koop" && isType(l.type, wt.naam)).length;
  const title = `${wt.mv} te koop in Nederland — ${n} woningen | Mooihuus`;
  const description = `${wt.intro} Bekijk ${n} ${wt.mv.toLowerCase()} te koop op Mooihuus, hét platform voor recreatiewoningen.`;
  return {
    title,
    description,
    alternates: { canonical: `/type/${params.type}` },
    openGraph: { title, description, url: `${COMPANY.website}/type/${params.type}`, type: "website" },
  };
}

export default function TypePagina({ params }: { params: { type: string } }) {
  const wt = typeVanSlug(params.type);
  if (!wt) return notFound();
  const woningen = getLiveListings()
    .filter((l) => l.doel === "koop" && isType(l.type, wt.naam))
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${wt.mv} te koop`,
    url: `${COMPANY.website}/type/${params.type}`,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-grijs mb-2"><Link href="/te-koop" className="hover:underline">Recreatiewoningen te koop</Link> · {wt.naam}</nav>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">{wt.mv} te koop</h1>
      <p className="text-grijs mt-2 max-w-2xl">{wt.intro}</p>
      <div className="text-sm text-grijs mt-3 mb-5">{woningen.length} {woningen.length === 1 ? "woning" : "woningen"} te koop.</div>

      {woningen.length === 0 ? (
        <div className="card text-grijs">Op dit moment staan er geen {wt.mv.toLowerCase()} te koop. <Link href="/zoeker" className="text-bosgroen font-semibold">Zet een woning-alert →</Link></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {woningen.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-2">Andere types recreatiewoningen</h2>
        <div className="flex flex-wrap gap-2">
          {WONINGTYPES.filter((t) => t.naam !== wt.naam).map((t) => (
            <Link key={t.naam} href={`/type/${typeSlug(t.naam)}`} className="pill hover:bg-zand">{t.mv}</Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-2">Recreatiewoningen per provincie</h2>
        <div className="flex flex-wrap gap-2">
          {PROVINCIES.map((p) => (
            <Link key={p} href={`/te-koop/${provincieSlug(p)}`} className="pill hover:bg-zand">{p}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
