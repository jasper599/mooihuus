import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, updateListing } from "@/lib/db";
import { Doel } from "@/lib/types";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol;
  if (!userId) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  const listing = getListing(params.id);
  if (!listing) return NextResponse.json({ error: "Woning niet gevonden." }, { status: 404 });
  if (listing.ownerId !== userId && rol !== "beheerder") {
    return NextResponse.json({ error: "Dit is niet jouw woning." }, { status: 403 });
  }

  const b = await req.json();
  const patch: any = {};
  if (typeof b.titel === "string") patch.titel = b.titel.slice(0, 120);
  if (typeof b.type === "string") patch.type = b.type.slice(0, 60);
  if (b.doel === "koop" || b.doel === "huur") patch.doel = b.doel as Doel;
  if (typeof b.provincie === "string") patch.provincie = b.provincie.slice(0, 60);
  if (typeof b.park === "string") patch.park = b.park.slice(0, 120);
  if (Number(b.personen) > 0) patch.personen = Number(b.personen);
  if (Number(b.m2) > 0) patch.m2 = Number(b.m2);
  if (Number(b.prijs) >= 0) patch.prijs = Number(b.prijs);
  if (typeof b.prijsSuffix === "string") patch.prijsSuffix = b.prijsSuffix.slice(0, 24);
  if (typeof b.grond === "string") patch.grond = b.grond.slice(0, 60);
  if (typeof b.videoUrl === "string") patch.videoUrl = b.videoUrl.slice(0, 300);
  if (typeof b.omschrijving === "string") patch.omschrijving = b.omschrijving.slice(0, 4000);
  if (Array.isArray(b.fotos)) patch.fotos = b.fotos.filter((f: any) => typeof f === "string").slice(0, 20);

  const updated = updateListing(params.id, patch);
  return NextResponse.json({ ok: true, id: updated?.id });
}
