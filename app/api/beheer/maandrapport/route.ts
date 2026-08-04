import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stuurMaandrapport, stuurAlleMaandrapporten } from "@/lib/maandrapport";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const { ownerId } = await req.json().catch(() => ({}));
  if (ownerId) {
    const r = await stuurMaandrapport(String(ownerId));
    if (!r.ok) return NextResponse.json(r, { status: 400 });
    return NextResponse.json(r);
  }
  const r = await stuurAlleMaandrapporten();
  return NextResponse.json({ ok: true, ...r });
}
