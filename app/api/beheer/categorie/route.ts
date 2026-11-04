import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, updateListing } from "@/lib/db";

export const runtime = "nodejs";

// Beheer: zet een woning handmatig op Mooihuus (recreatie) of Woonhuus (woonhuis).
// Die keuze blijft staan bij volgende Kolibri/Realworks-imports.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const { id, categorie } = await req.json().catch(() => ({}));
  if (categorie !== "recreatie" && categorie !== "woonhuis") {
    return NextResponse.json({ error: "Ongeldige categorie." }, { status: 400 });
  }
  const l = getListing(String(id || ""));
  if (!l) return NextResponse.json({ error: "Woning niet gevonden." }, { status: 404 });
  updateListing(l.id, { categorie, categorieHandmatig: true });
  return NextResponse.json({ ok: true, categorie });
}
