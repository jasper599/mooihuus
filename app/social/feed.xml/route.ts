import { getLiveListings } from "@/lib/db";
import { getBlogPosts as blogList } from "@/lib/blog";
import { COMPANY } from "@/lib/company";
import { HUUSMEESTERS_CATEGORIEEN, huusmeesterSlug } from "@/lib/partners";

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
  const huusItems: Item[] = HUUSMEESTERS_CATEGORIEEN.map((c) => {
    const slug = huusmeesterSlug(c.titel);
    return {
      title: `Huusmeesters — ${c.titel}`,
      link: `${SITE}/huusmeesters`,
      caption: `🛠️ ${c.titel} voor je recreatiewoning?\n\n${c.tekst}\n\nDe Huusmeesters van Mooihuus regelen het voor je. 👉 Kijk op mooihuus.nl/huusmeesters (link in bio).\n\n#huusmeesters #recreatiewoning #vakantiehuis #mooihuus`,
      image: `${SITE}/social/huusmeester/${slug}`,
      date: new Date(0).toUTCString(),
      guid: `huusmeester-${slug}`,
    };
  });

  // Rotatie "om en om": woning → blog → Huusmeester-categorie → woning → …
  // Loopt door alle drie de rijen; slaat een lege rij netjes over.
  const items: Item[] = [];
  let wi = 0, bi = 0, hi = 0;
  while (wi < woningItems.length || bi < blogItems.length || hi < huusItems.length) {
    if (wi < woningItems.length) items.push(woningItems[wi++]);
    if (bi < blogItems.length) items.push(blogItems[bi++]);
    if (hi < huusItems.length) items.push(huusItems[hi++]);
  }

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
