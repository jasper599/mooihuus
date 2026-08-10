import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBlogPosts } from "@/lib/blog";
import { addBlogPost, removeBlogPost } from "@/lib/db";
import { genereerBlogpostMetReden } from "@/lib/blog-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Genereert direct één nieuw blogartikel (buiten het wekelijkse ritme om) en
// slaat het op in de database. Beveiligd met CRON_SECRET of een beheerder.
// Aanroepen: GET /api/cron/blog?key=CRON_SECRET
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-cron-key");

  let toegestaan = false;
  if (secret && key === secret) toegestaan = true;
  if (!toegestaan) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.rol === "beheerder") toegestaan = true;
  }
  if (!toegestaan) return NextResponse.json({ error: "Geen toegang." }, { status: 401 });

  // ?verwijder=<slug> — verwijdert een (fout) artikel uit de database.
  const teVerwijderen = url.searchParams.get("verwijder");
  if (teVerwijderen) {
    const weg = removeBlogPost(teVerwijderen);
    return NextResponse.json({ ok: weg, verwijderd: weg ? teVerwijderen : null });
  }

  const bestaand = getBlogPosts();
  const { post, fout } = await genereerBlogpostMetReden(bestaand.map((p) => p.titel).slice(0, 40), bestaand.length);
  if (!post) {
    return NextResponse.json({ error: "Genereren mislukt", reden: fout || "onbekend" }, { status: 500 });
  }
  addBlogPost(post);
  return NextResponse.json({ ok: true, slug: post.slug, titel: post.titel });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
