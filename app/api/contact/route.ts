import { NextResponse } from "next/server";
import { renderContact, sendEmail } from "@/lib/email";
import { COMPANY } from "@/lib/company";

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
  await sendEmail({ aan: COMPANY.email, onderwerp: mail.onderwerp, soort: "contact", html: mail.html });

  return NextResponse.json({ ok: true });
}
