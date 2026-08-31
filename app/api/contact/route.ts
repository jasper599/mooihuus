import { NextResponse } from "next/server";
import { renderContact, sendEmail } from "@/lib/email";
import { COMPANY } from "@/lib/company";
import { addLead, getUserByEmail } from "@/lib/db";

export async function POST(req: Request) {
  const b = await req.json();
  const naam = String(b.naam || "").trim();
  const email = String(b.email || "").trim();
  const bericht = String(b.bericht || "").trim();
  const categorie = b.categorie ? String(b.categorie).trim() : undefined;
  const regio = b.regio ? String(b.regio).trim() : undefined;
  const onderwerp = String(b.onderwerp || (categorie ? `Hulpvraag: ${categorie}` : "Contactverzoek")).trim();

  if (!naam || !email || !bericht) {
    return NextResponse.json({ error: "Vul je naam, e-mail en bericht in." }, { status: 400 });
  }

  const mail = renderContact({ naam, email, onderwerp, bericht, categorie, regio });

  // Mantelzorg-aanvragen gaan naar onze partner Zorgwoning.nl (samenwerking),
  // met een kopie naar Mooihuus zodat we de leads blijven volgen.
  const isMantelzorg = (categorie || "").toLowerCase() === "mantelzorg";
  const ontvangers = isMantelzorg
    ? ["advies@zorgwoning.nl", COMPANY.email]
    : COMPANY.email;

  await sendEmail({ aan: ontvangers, onderwerp: mail.onderwerp, soort: "contact", html: mail.html });

  // Mantelzorg-lead ook koppelen aan het Zorgwoning.nl-account (advies-mail),
  // zodat de aanvraag naast de e-mail óók in hun dashboard verschijnt.
  if (isMantelzorg) {
    try {
      const partner = getUserByEmail("advies@zorgwoning.nl");
      if (partner) {
        addLead({ listingId: "", ownerId: partner.id, bron: "mantelzorg", naam, email, bericht });
      }
    } catch {
      // lead-koppeling mag de aanvraag nooit blokkeren
    }
  }

  return NextResponse.json({ ok: true });
}
