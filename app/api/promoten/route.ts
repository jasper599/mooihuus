import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, addPayment, updatePayment } from "@/lib/db";
import { OPVALLERS } from "@/lib/money";
import { mollieEnabled, createMolliePayment } from "@/lib/mollie";

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

  const payment = addPayment({
    listingId: listing.id,
    userId,
    pakket: listing.pakket,
    bedrag: opvaller.prijs,
    status: "open",
    methode: "iDEAL",
    soort: "opvaller",
    omschrijving: opvaller.id,
  });

  if (mollieEnabled()) {
    try {
      const { mollieId, checkoutUrl } = await createMolliePayment({
        bedrag: opvaller.prijs,
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
