import { NextResponse } from "next/server";
import { addLead, getListing, getUser, getLeads } from "@/lib/db";
import { renderLead, sendEmail } from "@/lib/email";

export async function GET() {
  return NextResponse.json(getLeads());
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.listingId || !body.naam || !body.email) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }
  const lead = addLead({
    listingId: String(body.listingId),
    naam: String(body.naam),
    email: String(body.email),
    bericht: String(body.bericht ?? ""),
  });

  // Lead gaat rechtstreeks naar de eigenaar — met een nette notificatiemail.
  const listing = getListing(lead.listingId);
  if (listing) {
    const owner = getUser(listing.ownerId);
    if (owner) {
      const mail = renderLead(lead, listing, owner.naam);
      await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "lead", html: mail.html });
    }
  }
  return NextResponse.json(lead, { status: 201 });
}
