import { NextResponse } from "next/server";
import { addIdee } from "@/lib/db";
import { isSpam } from "@/lib/antispam";
import { renderIdee, sendEmail } from "@/lib/email";
import { COMPANY } from "@/lib/company";

// Publieke ideeënbus. Inzendingen komen niet op de site; ze landen in het
// beheer en worden als seintje naar info@mooihuus.nl gemaild.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const naam = String(b.naam || "").trim();
  const email = String(b.email || "").trim();
  const categorie =
    String(b.categorie || "idee").trim().toLowerCase() === "opmerking" ? "opmerking" : "idee";
  const tekst = String(b.tekst || "").trim();

  if (tekst.length < 5) {
    return NextResponse.json({ error: "Schrijf je idee of opmerking even kort uit." }, { status: 400 });
  }

  // Bots stil laten vallen (honeypot + tijdslot + wartaal): we geven ok terug,
  // maar slaan niets op en mailen niets. Zo leert de bot niets.
  if (isSpam({ naam, email, bericht: tekst, honeypot: b.bedrijf, ts: b.ts })) {
    return NextResponse.json({ ok: true });
  }

  const idee = addIdee({
    naam: naam ? naam.slice(0, 60) : undefined,
    email: email ? email.slice(0, 120) : undefined,
    categorie,
    tekst: tekst.slice(0, 1500),
  });

  // Seintje naar info@ — mag de inzending nooit blokkeren.
  try {
    const mail = renderIdee({ naam: idee.naam, email: idee.email, categorie, tekst: idee.tekst });
    await sendEmail({ aan: COMPANY.email, onderwerp: mail.onderwerp, soort: "idee", html: mail.html });
  } catch {
    /* mail is bijzaak; de inzending staat al veilig in het beheer */
  }

  return NextResponse.json({ ok: true, id: idee.id });
}
