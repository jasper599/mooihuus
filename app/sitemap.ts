import type { MetadataRoute } from "next";
import { getLiveListings } from "@/lib/db";
import { getBlogPosts } from "@/lib/blog";
import { PROVINCIES, provincieSlug } from "@/lib/provincies";
import { WONINGTYPES, typeSlug } from "@/lib/woningtypes";
import { COMPANY } from "@/lib/company";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = COMPANY.website;
  const nu = new Date();

  const statisch = ["", "/te-koop", "/verhuur", "/openhuizen", "/zoeker", "/blog", "/reviews", "/huusmeesters", "/fotografie", "/guest-experience", "/mantelzorg", "/verkocht", "/contact", "/faq", "/plaatsen", "/registreren", "/inloggen", "/voorwaarden", "/privacy", "/cookies", "/disclaimer"];
  const pages: MetadataRoute.Sitemap = statisch.map((p) => ({
    url: `${base}${p}`,
    lastModified: nu,
    changeFrequency: p === "" ? "daily" : "monthly",
    priority: p === "" ? 1 : 0.6,
    alternates: {
      languages: {
        nl: `${base}${p}`,
        en: `${base}/en${p}`,
        de: `${base}/de${p}`,
      },
    },
  }));

  // Alleen eigen woningen in de sitemap — externe (affiliate) huurwoningen zijn
  // geen eigen content en horen niet als /aanbod-pagina in de index.
  const listings: MetadataRoute.Sitemap = getLiveListings()
    .filter((l) => !l.externalUrl)
    .map((l) => ({
      url: `${base}/aanbod/${l.id}`,
      lastModified: new Date(l.aangemaakt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const blog: MetadataRoute.Sitemap = getBlogPosts().map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.datum),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const seo: MetadataRoute.Sitemap = PROVINCIES.map((p) => ({
    url: `${base}/te-koop/${provincieSlug(p)}`,
    lastModified: nu,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const typeSeo: MetadataRoute.Sitemap = WONINGTYPES.map((t) => ({
    url: `${base}/type/${typeSlug(t.naam)}`,
    lastModified: nu,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...pages, ...seo, ...typeSeo, ...listings, ...blog];
}
