import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setReviewGoedgekeurd, deleteReview, getAllReviews } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const { id, action } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Geen id." }, { status: 400 });

  if (action === "delete") {
    deleteReview(String(id));
    return NextResponse.json({ ok: true });
  }
  const huidig = getAllReviews().find((r) => r.id === id);
  if (!huidig) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  setReviewGoedgekeurd(String(id), !huidig.goedgekeurd);
  return NextResponse.json({ ok: true });
}
