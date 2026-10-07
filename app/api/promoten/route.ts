import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, addPayment, updatePayment, valideerKortingscode, redeemKortingscode } from "@/lib/db";
import { OPVALLERS } from "@/lib/money";
import { mollieEnabled, createMolliePayment } from "@/lib/mollie";
import { markPaymentPaid } from "@/lib/payments";

function baseUrl(req: Request): string {
  return process.env.NEXTAUTH_URL || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Log eerst in om een opvaller te kopen." }, { status: 401 });
  }

  const b = await req.json();
  const listing = getListing(String(b.listingId || ""));
  if (!listing) return NextResponse.json({ error: "Advertentie niet gevonden." }, { status: 404 });
  if (listing.ownerId !== userId) {
    return NextResponse.json({ error: "Dit is niet jouw advertentie." }, { status: 403 });
  }
  if (listing.status !== "live") {
    return NextResponse.json({ error: "Je kunt alleen een opvaller kopen voor een advertentie die online staat." }, { status: 400 });
  }

  const opvaller = OPVALLERS.find((o) => o.id === String(b.opvaller));
  if (!opvaller) return NextResponse.json({ error: "Onbekende opvaller." }, { status: 400 });

  // Optionele kortingscode op de opvaller.
  let finaalBedrag = opvaller.prijs;
  let kortingCodeId: string | undefined;
  let kortingCodeTekst: string | undefined;
  let kortingCodeBedrag: number | undefined;
  const codeStr = typeof b.code === "string" ? b.code.trim() : "";
  if (codeStr) {
    const v = valideerKortingscode(codeStr, "opvaller", opvaller.prijs);
    if (!v.ok) return NextResponse.json({ error: v.reden || "Kortingscode ongeldig." }, { status: 422 });
    finaalBedrag = v.nieuwBedrag ?? opvaller.prijs;
    kortingCodeId = v.code!.id;
    kortingCodeTekst = v.code!.code;
    kortingCodeBedrag = v.kortingBedrag;
  }

  const payment = addPayment({
    listingId: listing.id,
    userId,
    pakket: listing.pakket,
    bedrag: finaalBedrag,
    status: "open",
    methode: "iDEAL",
    soort: "opvaller",
    omschrijving: opvaller.id,
    kortingscode: kortingCodeTekst,
    kortingBedrag: kortingCodeBedrag,
  });
  if (kortingCodeId) redeemKortingscode(kortingCodeId);

  // Gratis (cadeaucode): opvaller meteen activeren, geen betaalstap.
  if (finaalBedrag <= 0) {
    await markPaymentPaid(payment.id, "cadeau");
    return NextResponse.json({ redirect: `/betaling/${payment.id}`, extern: false, gratis: true });
  }

  if (mollieEnabled()) {
    try {
      const { mollieId, checkoutUrl } = await createMolliePayment({
        bedrag: finaalBedrag,
        beschrijving: `Mooihuus opvaller ${opvaller.naam} — ${listing.titel}`,
        redirectUrl: `${baseUrl(req)}/betaling/${payment.id}`,
        webhookUrl: `${baseUrl(req)}/api/webhook/mollie`,
      });
      updatePayment(payment.id, { mollieId });
      return NextResponse.json({ redirect: checkoutUrl, extern: true });
    } catch (e) {
      // Val terug op de interne (simulatie) checkout.
    }
  }

  return NextResponse.json({ redirect: `/betaling/${payment.id}`, extern: false });
}
