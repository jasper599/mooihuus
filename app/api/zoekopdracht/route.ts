import { NextResponse } from "next/server";
import { addZoekopdracht, getLiveListings, matchtZoekopdracht } from "@/lib/db";
import { renderZoekBevestiging, sendEmail } from "@/lib/email";
import { isSpam } from "@/lib/antispam";
import { Zoekopdracht } from "@/lib/types";

export async function POST(req: Request) {
  const b = await req.json();
  const naam = String(b.naam || "").trim();
  const email = String(b.email || "").trim();
  if (!naam || !email) {
    return NextResponse.json({ error: "Vul je naam en e-mailadres in." }, { status: 400 });
  }

  // Bots: honeypot, te snel ingestuurd, of wartaal-naam ("HIORrZOaXsaVSYBdaeei").
  // Stil accepteren — geen zoekopdracht opslaan en geen mail sturen.
  if (isSpam({ naam, email, honeypot: b.bedrijf, ts: b.ts })) {
    return NextResponse.json({ ok: true, matches: 0 });
  }

  const doel = ["koop", "huur"].includes(b.doel) ? b.doel : "alle";
  const provincie = b.provincie ? String(b.provincie) : "alle";
  const prijsMax = Number(b.prijsMax) > 0 ? Number(b.prijsMax) : undefined;
  const personenMin = Number(b.personenMin) > 0 ? Number(b.personenMin) : undefined;
  const type = b.type ? String(b.type) : undefined;

  const z = addZoekopdracht({
    naam, email, doel: doel as Zoekopdracht["doel"], provincie,
    prijsMax, personenMin, type, alerts: b.alerts === false ? false : true,
  });

  const matches = getLiveListings().filter((l) => matchtZoekopdracht(z, l));
  const mail = renderZoekBevestiging(z, matches);
  await sendEmail({ aan: z.email, onderwerp: mail.onderwerp, soort: "alert", html: mail.html });

  return NextResponse.json({ ok: true, matches: matches.length });
}
