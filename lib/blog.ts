import { BLOG_POSTS } from "./blog-posts";

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

export function getBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.datum.localeCompare(a.datum));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function formatDatum(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
