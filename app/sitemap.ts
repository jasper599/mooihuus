import type { MetadataRoute } from "next";
import { getLiveListings } from "@/lib/db";
import { getBlogPosts } from "@/lib/blog";
import { COMPANY } from "@/lib/company";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = COMPANY.website;
  const nu = new Date();

  const statisch = ["", "/zoeker", "/blog", "/reviews", "/huusmeesters", "/contact", "/faq", "/plaatsen", "/registreren", "/inloggen", "/voorwaarden", "/privacy", "/cookies", "/disclaimer"];
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

  const listings: MetadataRoute.Sitemap = getLiveListings().map((l) => ({
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

  return [...pages, ...listings, ...blog];
}
