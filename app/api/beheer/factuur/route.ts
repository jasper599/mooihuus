import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { maakMakelaarFactuur } from "@/lib/facturatie";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const { ownerId } = await req.json().catch(() => ({}));
  if (!ownerId) return NextResponse.json({ error: "Geen makelaar opgegeven." }, { status: 400 });
  const res = await maakMakelaarFactuur(String(ownerId));
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}
