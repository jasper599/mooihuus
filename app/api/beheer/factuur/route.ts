import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { maakMakelaarFactuur, maakLosseFactuur } from "@/lib/facturatie";
import { updatePayment } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));

  // 1) Een betaling handmatig op betaald/open zetten (vangnet voor
  //    betalingen die buiten de iDEAL-link om binnenkomen).
  if (body.paymentId && body.markeerBetaald !== undefined) {
    const patch =
      body.markeerBetaald === false
        ? { status: "open" as const, betaaldOp: undefined }
        : { status: "paid" as const, betaaldOp: new Date().toISOString(), methode: "Handmatig" };
    const updated = updatePayment(String(body.paymentId), patch);
    if (!updated) return NextResponse.json({ error: "Betaling niet gevonden." }, { status: 404 });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  const ownerId = body.ownerId;
  if (!ownerId) return NextResponse.json({ error: "Geen profiel opgegeven." }, { status: 400 });

  // 2) Losse factuur met eigen bedrag?
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

  // 3) Anders: automatische factuur op basis van feed-objecten.
  const res = await maakMakelaarFactuur(String(ownerId));
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}
