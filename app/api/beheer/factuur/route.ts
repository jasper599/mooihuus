import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { maakMakelaarFactuur, maakLosseFactuur } from "@/lib/facturatie";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const ownerId = body.ownerId;
  if (!ownerId) return NextResponse.json({ error: "Geen profiel opgegeven." }, { status: 400 });

  // Losse factuur met eigen bedrag?
  if (body.bedrag !== undefined && body.bedrag !== null && body.bedrag !== "") {
    const res = await maakLosseFactuur({
      ownerId: String(ownerId),
      nettoBedrag: Number(body.bedrag),
      btw: Boolean(body.btw),
      omschrijving: String(body.omschrijving || ""),
      mailen: Boolean(body.mailen),
    });
    if (!res.ok) return NextResponse.json(res, { status: 400 });
    return NextResponse.json(res);
  }

  // Anders: automatische factuur op basis van feed-objecten.
  const res = await maakMakelaarFactuur(String(ownerId));
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}
