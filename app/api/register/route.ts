import { NextResponse } from "next/server";
import { addUser, getUserByEmail } from "@/lib/db";
import { renderWelkom, sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { naam, email, wachtwoord, type, bedrijfsnaam, kvk } = await req.json();
  if (!naam || !email || !wachtwoord) {
    return NextResponse.json({ error: "Vul je naam, e-mail en wachtwoord in." }, { status: 400 });
  }
  if (String(wachtwoord).length < 6) {
    return NextResponse.json({ error: "Kies een wachtwoord van minstens 6 tekens." }, { status: 400 });
  }
  if (type === "zakelijk" && !bedrijfsnaam) {
    return NextResponse.json({ error: "Vul de bedrijfsnaam in voor een zakelijk account." }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "Er bestaat al een account met dit e-mailadres." }, { status: 409 });
  }
  const user = addUser({ naam, email, wachtwoord, type, bedrijfsnaam, kvk });
  const mail = renderWelkom(user.naam);
  await sendEmail({ aan: user.email, onderwerp: mail.onderwerp, soort: "welkom", html: mail.html });
  return NextResponse.json({ ok: true });
}
