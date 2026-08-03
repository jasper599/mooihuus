import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts, formatDatum } from "@/lib/blog";
import { gradient } from "@/lib/format";
import { getLocale } from "@/lib/i18n-server";
import { localeHref } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — tips & inspiratie voor je recreatiewoning | Mooihuus",
  description:
    "Tips over tuinonderhoud, gevelbekleding, verhuur en duurzaam recreëren, plus positieve verhalen over vakantie in eigen land. Het Mooihuus-blog.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getBlogPosts();
  const locale = getLocale();

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk">Blog</h1>
      <p className="text-grijs mt-2 max-w-2xl">
        Tips, feitjes en inspiratie rond je tweede huus — van tuinonderhoud en gevelbekleding tot
        slim verhuren en de mooiste plekken van Nederland. Elke week iets nieuws.
      </p>

      {posts.length === 0 ? (
        <div className="card text-grijs mt-6">Binnenkort verschijnen hier de eerste artikelen.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={localeHref(locale, `/blog/${p.slug}`)}
              className="block bg-white border border-lijn rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-28 flex items-center justify-center text-4xl" style={{ background: gradient(p.kleur) }}>
                <span aria-hidden>{p.emoji}</span>
              </div>
              <div className="p-4">
                <div className="text-xs font-display font-semibold text-oranje-dk uppercase tracking-wide">{p.categorie}</div>
                <div className="font-display font-bold text-inkt mt-1">{p.titel}</div>
                <p className="text-sm text-grijs mt-1 line-clamp-3">{p.intro}</p>
                <div className="text-xs text-grijs mt-3">{formatDatum(p.datum)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
