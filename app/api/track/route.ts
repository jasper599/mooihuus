import { NextResponse } from "next/server";
import { addPageview } from "@/lib/db";

export const runtime = "nodejs";

function classificeerRef(ref: string, eigenHost: string): string {
  if (!ref) return "direct";
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    if (eigenHost && h.endsWith(eigenHost.replace(/^www\./, ""))) return "direct"; // interne navigatie
    if (/google\./.test(h)) return "google";
    if (/bing\./.test(h)) return "bing";
    if (/(facebook|instagram|linkedin|t\.co|twitter|x\.com|pinterest|tiktok)/.test(h)) return "social";
    return h;
  } catch {
    return "direct";
  }
}

function classificeerDevice(ua: string): "mobiel" | "tablet" | "desktop" {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod|IEMobile|BlackBerry|Opera Mini/.test(ua)) return "mobiel";
  return "desktop";
}

const BOT_RE = /bot|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|facebot|embedly|quora|pinterest|vkshare|redditbot|applebot|yandex|baiduspider|duckduckbot|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|chatgpt|anthropic|perplexity|python-requests|axios|curl|wget|node-fetch|go-http|java/|okhttp|httpclient|headless|phantom|puppeteer|playwright|lighthouse|pagespeed|gtmetrix|monitor|uptime|pingdom|statuscake|site24x7|prerender|screaming/i;
function isBot(ua: string): boolean {
  return BOT_RE.test(ua);
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const path = String(b.path || "/");
    // Beheer/dashboard/api niet meetellen — dat is eigen verkeer.
    if (path.startsWith("/beheer") || path.startsWith("/dashboard") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    const vid = String(b.vid || "").slice(0, 40);
    if (!vid) return NextResponse.json({ ok: false }, { status: 400 });

    const ua = req.headers.get("user-agent") || "";
    // Bots eruit: bekende crawler/preview/headless user-agents niet meetellen.
    if (!ua || isBot(ua)) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    const eigenHost = new URL(req.url).hostname;
    const ref = classificeerRef(String(b.ref || ""), eigenHost);

    addPageview({ path, ref, device: classificeerDevice(ua), vid });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
