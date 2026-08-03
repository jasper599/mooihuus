import { NextResponse } from "next/server";
import { getUserByEmail, maakResetToken } from "@/lib/db";
import { renderWachtwoordReset, sendEmail } from "@/lib/email";

function baseUrl(req: Request): string {
  return process.env.NEXTAUTH_URL || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const b = await req.json();
  const email = String(b.email || "").trim();
  const user = getUserByEmail(email);

  // Altijd 'ok' terugsturen — verklap niet of een e-mailadres bestaat.
  if (user) {
    const token = maakResetToken(user.id);
    const resetUrl = `${baseUrl(req)}/wachtwoord-reset?token=${token}`;
    const mail = renderWachtwoordReset(user.naam, resetUrl);
    await sendEmail({ aan: user.email, onderwerp: mail.onderwerp, soort: "contact", html: mail.html });
  }
  return NextResponse.json({ ok: true });
}
