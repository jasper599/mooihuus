import { NextResponse } from "next/server";
import { addLead, getListing, getUser, getLeads } from "@/lib/db";
import { renderLead, renderLeadBevestiging, sendEmail } from "@/lib/email";

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
    telefoon: body.telefoon ? String(body.telefoon).slice(0, 40) : undefined,
    bericht: String(body.bericht ?? ""),
  });

  // Mails niet-blokkerend versturen: de aanvraag is al opgeslagen, dus de
  // bezoeker krijgt direct een bevestiging op het scherm — ook als de
  // mailserver traag is of even niet bereikbaar is.
  const listing = getListing(lead.listingId);
  if (listing) {
    const owner = getUser(listing.ownerId);
    void (async () => {
      try {
        // Notificatie naar de aanbieder van de woning.
        if (owner) {
          const mail = renderLead(lead, listing, owner.naam);
          await sendEmail({ aan: owner.email, onderwerp: mail.onderwerp, soort: "lead", html: mail.html });
        }
        // Bevestiging naar de aanvrager zelf.
        const bev = renderLeadBevestiging(lead, listing);
        await sendEmail({ aan: lead.email, onderwerp: bev.onderwerp, soort: "lead", html: bev.html });
      } catch {
        /* mail niet fataal — de lead staat al opgeslagen */
      }
    })();
  }
  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
