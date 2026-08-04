import { getLiveListings } from "@/lib/db";
import { getBlogPosts as blogList } from "@/lib/blog";
import { COMPANY } from "@/lib/company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = COMPANY.website;

function xml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function hashtag(s: string): string {
  return "#" + s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function euro(n: number): string {
  return "€ " + n.toLocaleString("nl-NL");
}

function listingCaption(l: any): string {
  const suffix = l.prijsSuffix && l.prijsSuffix !== "geen" ? l.prijsSuffix : l.doel === "koop" ? "k.k." : "";
  const kort = (l.omschrijving || "").replace(/\s+/g, " ").trim().slice(0, 180);
  const tags = ["#recreatiewoning", "#vakantiehuis", "#tweedehuis", hashtag(l.provincie), l.park ? hashtag(l.park) : "", "#mooihuus"].filter(Boolean).join(" ");
  return [
    `🌲 ${l.titel}`,
    `📍 ${l.park ? l.park + ", " : ""}${l.provincie}`,
    `💶 ${euro(l.prijs)}${suffix ? " " + suffix : ""} · ${l.doel === "huur" ? "te huur" : "te koop"}`,
    ``,
    kort ? kort + (l.omschrijving && l.omschrijving.length > 180 ? "…" : "") : "",
    ``,
    `👉 Bekijk 'm via de link in onze bio.`,
    ``,
    tags,
  ].filter((x) => x !== undefined).join("\n");
}

function blogCaption(p: any): string {
  const intro = (p.intro || "").replace(/\s+/g, " ").trim().slice(0, 200);
  return [
    `${p.emoji} ${p.titel}`,
    ``,
    intro,
    ``,
    `👉 Lees het hele artikel via de link in onze bio.`,
    ``,
    `#recreatiewoning #vakantiehuis #tips #mooihuus ${hashtag(p.categorie)}`,
  ].join("\n");
}

export async function GET() {
  const listings = getLiveListings()
    .slice()
    .sort((a, b) => (b.uitgelicht ? 1 : 0) - (a.uitgelicht ? 1 : 0) || String(b.aangemaakt).localeCompare(String(a.aangemaakt)))
    .slice(0, 30);
  const posts = blogList().slice(0, 10);

  type Item = { title: string; link: string; caption: string; image: string; date: string; guid: string };

  const woningItems: Item[] = listings.map((l) => ({
    title: `${l.type} ${l.doel === "huur" ? "te huur" : "te koop"} in ${l.provincie} — ${euro(l.prijs)}`,
    link: `${SITE}/aanbod/${l.id}`,
    caption: listingCaption(l),
    image: `${SITE}/social/woning/${l.id}`,
    date: new Date(l.aangemaakt || 0).toUTCString(),
    guid: `woning-${l.id}`,
  }));
  const blogItems: Item[] = posts.map((p) => ({
    title: p.titel,
    link: `${SITE}/blog/${p.slug}`,
    caption: blogCaption(p),
    image: `${SITE}/social/blog/${p.slug}`,
    date: new Date(p.datum).toUTCString(),
    guid: `blog-${p.slug}`,
  }));

  // Afwisselen: na elke 3 woningen een blogartikel, zodat de feed "om en om" loopt.
  const items: Item[] = [];
  let bi = 0;
  for (let i = 0; i < woningItems.length; i++) {
    items.push(woningItems[i]);
    if ((i + 1) % 3 === 0 && bi < blogItems.length) items.push(blogItems[bi++]);
  }
  while (bi < blogItems.length) items.push(blogItems[bi++]);

  const body = items
    .map(
      (it) => `    <item>
      <title>${xml(it.title)}</title>
      <link>${xml(it.link)}</link>
      <guid isPermaLink="false">${xml(it.guid)}</guid>
      <pubDate>${it.date}</pubDate>
      <description><![CDATA[${it.caption}]]></description>
      <enclosure url="${xml(it.image)}" type="image/png" />
      <media:content url="${xml(it.image)}" medium="image" type="image/png" />
    </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Mooihuus — nieuw aanbod & blog</title>
    <link>${SITE}</link>
    <description>Automatische feed van nieuwe recreatiewoningen en blogartikelen voor social media.</description>
    <language>nl-nl</language>
${body}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=1800" },
  });
}
