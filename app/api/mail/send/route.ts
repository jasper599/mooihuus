import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail, renderSimpel } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Beveiligd verzend-eindpunt voor Mooihuus-mail namens Guus.
// Verstuurt via de bestaande Resend-route (zoals noreply), maar met
// afzender "Guus <info@mooihuus.nl>". Zo kan de geautomatiseerde assistent
// echt als info@mooihuus.nl antwoorden, los van de Gmail-koppeling.
//
// Twee manieren van aanroepen:
//   POST /api/mail/send?key=CRON_SECRET
//     body: { aan, onderwerp, html | tekst, replyTo?, van? }
//   GET  /api/mail/send?key=CRON_SECRET&aan=...&onderwerp=...&tekst=...
//     (handig vanuit een geautomatiseerde sessie die alleen GET kan doen)
//
// Als alleen "tekst" wordt meegegeven, wordt die automatisch in de
// Mooihuus-huisstijl gezet met de handtekening van Guus eronder.

const STD_VAN = "Guus <info@mooihuus.nl>";
const STD_REPLY = "info@mooihuus.nl";

const HANDTEKENING = `<br>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;"><tr><td style="padding-right:18px;border-right:3px solid #2C6B45;vertical-align:top;"><div style="font-size:21px;font-weight:800;letter-spacing:-.01em;line-height:1;"><span style="color:#7CAE86;">Mooi</span><span style="color:#1F4E32;">huus</span><span style="color:#E8823B;">.nl</span></div><div style="font-size:12px;color:#6B7A70;margin-top:6px;font-style:italic;">Zelf de regie, nooit alleen.</div></td><td style="padding-left:18px;vertical-align:top;"><div style="font-size:15px;font-weight:bold;color:#22302A;">Guus</div><div style="font-size:13px;color:#6B7A70;margin-top:1px;">Huusmeester van Mooihuus</div><div style="font-size:13px;margin-top:10px;line-height:1.7;"><a href="mailto:info@mooihuus.nl" style="color:#2C6B45;text-decoration:none;">info@mooihuus.nl</a><br><a href="https://mooihuus.nl" style="color:#2C6B45;text-decoration:none;">mooihuus.nl</a></div></td></tr></table>`;

function bouwHtml(opts: { html?: string; tekst?: string; onderwerp: string }): string | null {
  if (opts.html && opts.html.trim()) return opts.html;
  if (opts.tekst && opts.tekst.trim()) {
    const alineas = String(opts.tekst)
      .split(/\n{2,}/)
      .map((p) => `<p style="line-height:1.6;margin:0 0 14px;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
    const inner = `${alineas}<p style="line-height:1.6;margin:18px 0 0;">Hartelijke groet,<br>Guus van Mooihuus.nl</p>${HANDTEKENING}`;
    return renderSimpel(opts.onderwerp, inner).html;
  }
  return null;
}

async function toegang(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-cron-key");
  if (secret && key === secret) return true;
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.rol === "beheerder";
}

async function verstuur(d: { aan?: string; onderwerp?: string; html?: string; tekst?: string; replyTo?: string; van?: string }) {
  const aan = d.aan;
  const onderwerp = d.onderwerp;
  if (!aan || !onderwerp) {
    return NextResponse.json({ ok: false, error: "Vereist: aan, onderwerp." }, { status: 400 });
  }
  const html = bouwHtml({ html: d.html, tekst: d.tekst, onderwerp });
  if (!html) {
    return NextResponse.json({ ok: false, error: "Vereist: html of tekst." }, { status: 400 });
  }
  const rec = await sendEmail({
    aan,
    onderwerp,
    html,
    soort: "contact",
    van: d.van || STD_VAN,
    replyTo: d.replyTo || STD_REPLY,
  });
  return NextResponse.json({ ok: rec.verzondenVia === "smtp", via: rec.verzondenVia, id: rec.id, afzender: d.van || STD_VAN });
}

export async function GET(req: Request) {
  if (!(await toegang(req))) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 401 });
  const u = new URL(req.url);
  return verstuur({
    aan: u.searchParams.get("aan") || u.searchParams.get("to") || undefined,
    onderwerp: u.searchParams.get("onderwerp") || u.searchParams.get("subject") || undefined,
    html: u.searchParams.get("html") || undefined,
    tekst: u.searchParams.get("tekst") || u.searchParams.get("text") || undefined,
    replyTo: u.searchParams.get("replyTo") || undefined,
    van: u.searchParams.get("van") || undefined,
  });
}

export async function POST(req: Request) {
  if (!(await toegang(req))) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 401 });
  let data: any;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldige JSON." }, { status: 400 });
  }
  return verstuur({
    aan: data?.aan ?? data?.to,
    onderwerp: data?.onderwerp ?? data?.subject,
    html: data?.html,
    tekst: data?.tekst ?? data?.text,
    replyTo: data?.replyTo,
    van: data?.van,
  });
}
