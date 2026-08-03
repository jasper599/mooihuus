// Voegt één blogartikel toe aan lib/blog-posts.ts (prepend).
// Gebruik: node scripts/add-post.mjs pad/naar/artikel.json
// Verwacht JSON met: titel, categorie, emoji, intro, body (markdown), optioneel slug.
import fs from "fs";
import path from "path";

const jsonPath = process.argv[2];
if (!jsonPath) { console.error("Geef een JSON-bestand mee."); process.exit(1); }
const art = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const file = path.join(process.cwd(), "lib", "blog-posts.ts");
let src = fs.readFileSync(file, "utf8");

function slugify(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
let slug = art.slug ? slugify(art.slug) : slugify(art.titel);
const bestaand = new Set([...src.matchAll(/"slug":\s*"([^"]+)"/g)].map((m) => m[1]));
if (!slug || bestaand.has(slug)) { let n = 2; while (bestaand.has(`${slug}-${n}`)) n++; slug = `${slug}-${n}`; }

const kleur = bestaand.size % 6;
const post = {
  slug,
  titel: String(art.titel || "Zonder titel"),
  categorie: String(art.categorie || "Blog"),
  emoji: String(art.emoji || "📝"),
  kleur,
  datum: new Date().toISOString(),
  intro: String(art.intro || ""),
  body: String(art.body || ""),
};

const marker = "export const BLOG_POSTS: BlogPost[] = [";
const idx = src.indexOf(marker);
if (idx === -1) { console.error("Kon BLOG_POSTS niet vinden."); process.exit(1); }
const insertAt = idx + marker.length;
const literal = "\n  " + JSON.stringify(post, null, 2).replace(/\n/g, "\n  ") + ",";
src = src.slice(0, insertAt) + literal + src.slice(insertAt);
fs.writeFileSync(file, src, "utf8");
console.log("Toegevoegd:", slug);
