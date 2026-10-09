import { NextResponse } from "next/server";
import { addLead } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { COMPANY } from "@/lib/company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ticket-eindpunt voor Guus (Mooihuus). Als Guus een belprobleem niet zelf
// kan oplossen, maakt hij hiermee een ticket aan: het verschijnt in beheer
// (als lead met bron "support-telefoon") en gaat per mail naar het team.

function geautoriseerd(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-cron-key");
  return key === secret;
}

function esc(s: string): string {
  return String(s).replace(
    /[&<>"]/g,
    (c) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as Record<string, string>)[c])
  );
}

export async function POST(req: Request) {
  if (!geautoriseerd(req)) {
    return NextResponse.json({ ok: false, error: "Niet geautoriseerd." }, { status: 403 });
  }

  const b = await req.json().catch(() => ({} as any));
  const naam = String(b.naam || "").trim() || "Onbekende beller";
  const email = String(b.email || "").trim();
  const telefoon = String(b.telefoon || b.caller_id || "").trim();
  const onderwerp = String(b.onderwerp || "Telefonisch ticket").trim();
  const omschrijving = String(b.omschrijving || b.bericht || "").trim();

  if (!omschrijving) {
    return NextResponse.json({ ok: false, error: "Geen omschrijving meegegeven." }, { status: 400 });
  }

  const bericht = `[Telefonisch ticket via Guus]\nOnderwerp: ${onderwerp}\n\n${omschrijving}`;

  let ticketId = "";
  try {
    const lead = addLead({
      listingId: "",
      bron: "support-telefoon",
      naam,
      email: email || "onbekend@mooihuus.nl",
      telefoon: telefoon || undefined,
      bericht,
    });
    ticketId = lead.id;
  } catch {
    // opslaan mag de ticketflow nooit blokkeren
  }

  try {
    const html = `<p><strong>Nieuw telefonisch ticket via Guus</strong></p>
<p><strong>Onderwerp:</strong> ${esc(onderwerp)}<br>
<strong>Naam:</strong> ${esc(naam)}<br>
<strong>Telefoon:</strong> ${esc(telefoon || "-")}<br>
<strong>E-mail:</strong> ${esc(email || "-")}</p>
<p><strong>Melding:</strong><br>${esc(omschrijving).replace(/\n/g, "<br>")}</p>
<p style="color:#6B7A70;font-size:12px">Automatisch aangemaakt door Guus${ticketId ? ` · ticket ${esc(ticketId)}` : ""}.</p>`;
    await sendEmail({
      aan: COMPANY.email,
      onderwerp: `🎫 Ticket via Guus — ${onderwerp}`,
      soort: "contact",
      html,
      replyTo: email || undefined,
    });
  } catch {
    // mail mag de ticketflow nooit blokkeren
  }

  return NextResponse.json({
    ok: true,
    ticket_id: ticketId,
    antwoord: "Ik heb een ticket voor je aangemaakt; een collega pakt het zo snel mogelijk op.",
  });
}
