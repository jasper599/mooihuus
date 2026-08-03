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
    const eigenHost = new URL(req.url).hostname;
    const ref = classificeerRef(String(b.ref || ""), eigenHost);

    addPageview({ path, ref, device: classificeerDevice(ua), vid });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
