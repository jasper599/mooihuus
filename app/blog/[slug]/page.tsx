import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getBlogPosts, formatDatum } from "@/lib/blog";
import { gradient } from "@/lib/format";
import { getLocale } from "@/lib/i18n-server";
import { localeHref } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { Markdown } from "@/components/Markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getBlogPost(params.slug);
  if (!post) return { title: "Artikel niet gevonden" };
  return {
    title: `${post.titel} | Mooihuus blog`,
    description: post.intro,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.titel, description: post.intro, type: "article", url: `${COMPANY.website}/blog/${post.slug}` },
  };
}

export default function BlogArtikel({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) return notFound();
  const locale = getLocale();
  const overige = getBlogPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.titel,
    description: post.intro,
    datePublished: post.datum,
    author: { "@type": "Organization", name: "Mooihuus" },
    publisher: { "@type": "Organization", name: "Mooihuus" },
    mainEntityOfPage: `${COMPANY.website}/blog/${post.slug}`,
  };

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href={localeHref(locale, "/blog")} className="text-sm text-bosgroen hover:underline">← Terug naar het blog</Link>

      <div className="h-40 rounded-2xl flex items-center justify-center text-6xl mt-3" style={{ background: gradient(post.kleur) }}>
        <span aria-hidden>{post.emoji}</span>
      </div>

      <div className="text-xs font-display font-semibold text-oranje-dk uppercase tracking-wide mt-5">{post.categorie}</div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk mt-1">{post.titel}</h1>
      <div className="text-sm text-grijs mt-2">{formatDatum(post.datum)} · Mooihuus</div>
      <p className="text-lg text-inkt mt-4 leading-relaxed">{post.intro}</p>

      <article className="mt-4">
        <Markdown source={post.body} />
      </article>

      <div className="card mt-8 border-salie flex flex-wrap items-center gap-4">
        <div className="text-3xl">🏡</div>
        <div className="flex-1 min-w-[220px]">
          <div className="font-display font-bold text-bosgroen-dk">Zelf je huus in de etalage?</div>
          <div className="text-sm text-grijs">Plaats je recreatiewoning op Mooihuus — eerlijke prijs, leads rechtstreeks naar jou.</div>
        </div>
        <Link href={localeHref(locale, "/plaatsen")} className="btn text-sm">Plaats je huus</Link>
      </div>

      {overige.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-3">Meer lezen</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {overige.map((p) => (
              <Link key={p.slug} href={localeHref(locale, `/blog/${p.slug}`)} className="block bg-white border border-lijn rounded-xl p-3 hover:shadow-md transition-shadow">
                <div className="text-2xl">{p.emoji}</div>
                <div className="font-display font-semibold text-sm text-inkt mt-1 line-clamp-2">{p.titel}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
