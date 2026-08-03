import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addEnquete } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const { rating, aanbeveling, opmerking, listingId } = await req.json();
  const r = Number(rating);
  if (!r || r < 1 || r > 5) {
    return NextResponse.json({ error: "Geef een beoordeling van 1 tot 5." }, { status: 400 });
  }
  const enq = addEnquete({
    userId,
    listingId: listingId ? String(listingId) : undefined,
    rating: r,
    aanbeveling: aanbeveling != null ? Number(aanbeveling) : undefined,
    opmerking: String(opmerking ?? ""),
  });
  return NextResponse.json({ ok: true, id: enq.id });
}
