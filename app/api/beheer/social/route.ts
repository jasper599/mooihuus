import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSocialPost, updateSocialPost, getListing } from "@/lib/db";
import { metricoolEnabled, scheduleInstagramPost, volgendeSlot } from "@/lib/metricool";
import { genereerSocialCaption } from "@/lib/social-caption";

// Beheeracties op de social-wachtrij:
//  - geplaatst    : markeer als handmatig geplaatst
//  - wachtrij     : terug naar de wachtrij
//  - inplannen    : (opnieuw) via Metricool inplannen
//  - annuleren    : markeer als mislukt/geannuleerd
//  - bewerken     : sla een aangepaste caption op
//  - genereren    : laat de AI een nieuwe caption schrijven
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const post = getSocialPost(String(b.id || ""));
  if (!post) return NextResponse.json({ error: "Post niet gevonden." }, { status: 404 });
  const actie = String(b.actie || "");

  if (actie === "geplaatst") {
    const p = updateSocialPost(post.id, { status: "geplaatst", geplaatstOp: new Date().toISOString() });
    return NextResponse.json({ ok: true, status: p?.status });
  }
  if (actie === "wachtrij") {
    const p = updateSocialPost(post.id, { status: "wachtrij", geplaatstOp: undefined });
    return NextResponse.json({ ok: true, status: p?.status });
  }
  if (actie === "annuleren") {
    const p = updateSocialPost(post.id, { status: "mislukt" });
    return NextResponse.json({ ok: true, status: p?.status });
  }
  if (actie === "bewerken") {
    const tekst = String(b.tekst ?? "").trim();
    if (!tekst) return NextResponse.json({ error: "Lege caption." }, { status: 400 });
    const p = updateSocialPost(post.id, { tekst: tekst.slice(0, 2000) });
    return NextResponse.json({ ok: true, tekst: p?.tekst });
  }
  if (actie === "genereren") {
    const listing = getListing(post.listingId);
    if (!listing) return NextResponse.json({ error: "Woning niet gevonden." }, { status: 404 });
    const tekst = await genereerSocialCaption(listing);
    const p = updateSocialPost(post.id, { tekst });
    return NextResponse.json({ ok: true, tekst: p?.tekst });
  }
  if (actie === "inplannen") {
    if (!metricoolEnabled()) {
      return NextResponse.json({ error: "Metricool is niet gekoppeld. Stel de METRICOOL_-variabelen in." }, { status: 400 });
    }
    const listing = getListing(post.listingId);
    const publishAt = volgendeSlot(post.prioriteit, new Date());
    const r = await scheduleInstagramPost({
      tekst: post.tekst || listing?.titel || "Mooihuus",
      fotoUrl: post.fotoUrl || listing?.fotos?.[0],
      publishAt,
    });
    if (r.ok) {
      const p = updateSocialPost(post.id, { status: "ingepland", metricoolId: r.id, ingeplandVoor: publishAt, notitie: undefined });
      return NextResponse.json({ ok: true, status: p?.status, ingeplandVoor: publishAt });
    }
    updateSocialPost(post.id, { notitie: `Metricool: ${r.error || "inplannen mislukt"}` });
    return NextResponse.json({ error: r.error || "Inplannen mislukt." }, { status: 502 });
  }

  return NextResponse.json({ error: "Onbekende actie." }, { status: 400 });
}
