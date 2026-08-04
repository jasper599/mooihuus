import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addListing, addPayment, updatePayment, getListings, getListingsByOwner } from "@/lib/db";
import { prijsMetKorting } from "@/lib/money";
import { Doel, Pakket } from "@/lib/types";
import { mollieEnabled, createMolliePayment } from "@/lib/mollie";

function baseUrl(req: Request): string {
  return process.env.NEXTAUTH_URL || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Log eerst in om een woning te plaatsen." }, { status: 401 });
  }

  const b = await req.json();
  const pakket = (["Basis", "Plus", "Premium"].includes(b.pakket) ? b.pakket : "Basis") as Pakket;

  const listing = addListing({
    ownerId: userId,
    titel: String(b.titel || `${b.type} in ${b.provincie}`),
    type: String(b.type || "Chalet"),
    doel: (b.doel === "huur" ? "huur" : "koop") as Doel,
    provincie: String(b.provincie || "Nederland"),
    park: String(b.park || ""),
    personen: Number(b.personen || 2),
    m2: Number(b.m2 || 50),
    prijs: Number(b.prijs || 0),
    prijsSuffix: b.prijsSuffix ? String(b.prijsSuffix).slice(0, 24) : undefined,
    grond: b.grond ? String(b.grond).slice(0, 60) : undefined,
    videoUrl: b.videoUrl ? String(b.videoUrl).slice(0, 300) : undefined,
    omschrijving: String(b.omschrijving || ""),
    kleur: getListings().length % 6,
    pakket,
    status: "wacht_op_betaling",
    postcode: b.postcode ? String(b.postcode) : undefined,
    uitjes: Array.isArray(b.uitjes) ? b.uitjes.map(String).slice(0, 12) : undefined,
  });

  // Volumekorting: telt alle objecten van deze eigenaar (inclusief de nieuwe).
  const aantalObjecten = getListingsByOwner(userId).length;
  const { bedrag, pct } = prijsMetKorting(pakket, aantalObjecten);
  const payment = addPayment({
    listingId: listing.id,
    userId,
    pakket,
    bedrag,
    status: "open",
    methode: "iDEAL",
    kortingPct: pct > 0 ? pct : undefined,
  });

  if (mollieEnabled()) {
    try {
      const { mollieId, checkoutUrl } = await createMolliePayment({
        bedrag,
        beschrijving: `Mooihuus ${pakket} — ${listing.titel}`,
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
