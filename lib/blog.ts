import { BLOG_POSTS } from "./blog-posts";
import { getExtraBlogPosts } from "./db";

export interface BlogPost {
  slug: string;
  titel: string;
  categorie: string;
  emoji: string;
  kleur: number;
  datum: string; // ISO-datum
  intro: string;
  body: string; // Markdown
}

// Combineert de statische startset met de automatisch gegenereerde posts uit
// de database (deze laatste winnen bij een gelijke slug).
export function getBlogPosts(): BlogPost[] {
  const map = new Map<string, BlogPost>();
  for (const p of BLOG_POSTS) map.set(p.slug, p);
  try {
    for (const p of getExtraBlogPosts()) map.set(p.slug, p);
  } catch {
    /* db nog niet beschikbaar — val terug op de statische set */
  }
  return Array.from(map.values()).sort((a, b) => b.datum.localeCompare(a.datum));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  try {
    const uitDb = getExtraBlogPosts().find((p) => p.slug === slug);
    if (uitDb) return uitDb;
  } catch {
    /* negeer */
  }
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function formatDatum(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
