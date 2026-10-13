import { NextResponse } from "next/server";
import { addNieuwsbriefPending } from "@/lib/db";
import { isSpam } from "@/lib/antispam";
import { sendEmail, renderSimpel } from "@/lib/email";
import { COMPANY } from "@/lib/company";

export const runtime = "nodejs";

const OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim();
  if (!OK.test(email)) {
    return NextResponse.json({ error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }
  // Bots: honeypot gevuld of binnen enkele honderden ms ingestuurd. Stil
  // accepteren (ok terug) maar niet aanmelden — zo leert de bot niets.
  if (isSpam({ email, honeypot: b.bedrijf, ts: b.ts })) {
    return NextResponse.json({ ok: true });
  }

  // Dubbele opt-in: nog NIET op de lijst zetten. We zetten het adres op de
  // 'nog te bevestigen'-lijst en sturen één bevestigingsmail. Pas na klikken
  // staat iemand echt op de nieuwsbrief — zo komen bots er niet meer in.
  const { token, alLid } = addNieuwsbriefPending(email);

  if (!alLid && token) {
    const bevestigUrl = `${COMPANY.website}/api/nieuwsbrief/bevestig?token=${token}`;
    const body = `
      <p style="margin:0 0 12px;">Bedankt voor je aanmelding voor de Mooihuus-nieuwsbrief!</p>
      <p style="margin:0 0 16px;">Bevestig nog even je aanmelding door op de knop te klikken. Zonder bevestiging sturen we je niets.</p>
      <p style="margin:0 0 20px;">
        <a href="${bevestigUrl}" style="display:inline-block;background:#2F4A3C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Aanmelding bevestigen</a>
      </p>
      <p style="margin:0;color:#8A978E;font-size:13px;">Heb jij je niet aangemeld? Dan kun je deze mail negeren — er gebeurt niets.</p>`;
    const mail = renderSimpel("Bevestig je aanmelding", body);
    try {
      await sendEmail({ aan: email, onderwerp: mail.onderwerp, soort: "nieuwsbrief", html: mail.html });
    } catch {
      /* mail mislukt — geen enumeratie, gewoon ok terug */
    }
  }

  // Altijd ok terugmelden (geen e-mailadres-enumeratie).
  return NextResponse.json({ ok: true, bevestiging: !alLid });
}
