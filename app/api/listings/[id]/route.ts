import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, deleteListing } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol;
  if (!userId) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const listing = getListing(params.id);
  if (!listing) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  if (listing.ownerId !== userId && rol !== "beheerder") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  deleteListing(listing.id);
  return NextResponse.json({ ok: true });
}
