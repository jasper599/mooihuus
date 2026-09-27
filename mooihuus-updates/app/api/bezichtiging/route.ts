import { NextResponse } from "next/server";
import { addLead, getListing, getUser } from "@/lib/db";
import { renderBezichtiging, sendEmail } from "@/lib/email";
import { isSpam } from "@/lib/antispam";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!b.listingId || !b.naam || !b.email || !b.datum) {
    return NextResponse.json({ error: "Vul je naam, e-mail en een voorkeursdatum in." }, { status: 400 });
  }
  const datum = String(b.datum);
  const tijd = String(b.tijd || "");
  const bericht = String(b.bericht || "");

  // Spam (bots) stil laten vallen: geen verzoek opslaan, geen mail versturen.
  if (isSpam({ naam: String(b.naam), email: String(b.email), bericht, honeypot: b.bedrijf, ts: b.ts })) {
    return NextResponse.json({ ok: true });
  }

  const listing = getListing(String(b.listingId));
  if (!listing) return NextResponse.json({ error: "Woning niet gevonden." }, { status: 404 });

  const lead = addLead({
    listingId: listing.id,
    naam: String(b.naam),
    email: String(b.email),
    bericht: `🗓️ Bezichtigingsverzoek — voorkeur ${datum}${tijd ? " " + tijd : ""}.${bericht ? " " + bericht : ""}`,
  });

  const owner = getUser(listing.ownerId);
  if (owner) {
    const mail = renderBezichtiging(listing, { naam: String(b.naam), email: String(b.email), datum, tijd, bericht });
    await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "bezichtiging", html: mail.html });
  }
  return NextResponse.json({ ok: true, id: lead.id });
}
