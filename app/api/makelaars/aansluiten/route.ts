import { NextResponse } from "next/server";
import { addRealworksKoppeling, updateRealworksKoppeling } from "@/lib/db";
import { testRealworksSleutel } from "@/lib/feed-import";
import { sendEmail, renderSimpel } from "@/lib/email";
import { COMPANY } from "@/lib/company";
import { isSpam } from "@/lib/antispam";

// Aanmelding van een Realworks-kantoor via /makelaars/aansluiten. De makelaar
// heeft in Realworks zelf de Wonen API geactiveerd en plakt hier de sleutel.
// We controleren de sleutel direct; werkt hij nog niet (bijv. omdat Realworks
// hem nog moet vrijgeven), dan bewaren we hem toch en kijken we er zelf naar.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const kantoor = String(b.kantoor || "").trim().slice(0, 120);
  const contactNaam = String(b.contactNaam || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().slice(0, 160);
  const telefoon = String(b.telefoon || "").trim().slice(0, 40) || undefined;
  const token = String(b.token || "").trim().replace(/^rwauth\s+/i, "");

  if (!kantoor || !contactNaam || !email || !token) {
    return NextResponse.json({ error: "Vul kantoornaam, uw naam, e-mail en de API-sleutel in." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Dat e-mailadres lijkt niet te kloppen." }, { status: 400 });
  }
  if (token.length < 16 || token.length > 400 || /\s/.test(token)) {
    return NextResponse.json({ error: "Dat lijkt geen geldige API-sleutel. Kopieer de sleutel in zijn geheel uit Realworks." }, { status: 400 });
  }
  if (isSpam({ naam: contactNaam, email, bericht: kantoor, onderwerp: "aansluiten", honeypot: b.website, ts: b.ts })) {
    return NextResponse.json({ ok: true, werkt: false });
  }

  const k = addRealworksKoppeling({ kantoor, contactNaam, email, telefoon, token });
  const test = await testRealworksSleutel(token);
  if (test.ok) {
    updateRealworksKoppeling(k.id, { status: "actief", fout: undefined, aantalWoningen: test.aantal });
  } else {
    updateRealworksKoppeling(k.id, { fout: test.fout });
  }

  // Seintje aan ons, zodat een aanmelding nooit blijft liggen.
  const s = renderSimpel(
    `Nieuwe Realworks-aanmelding: ${kantoor}`,
    `<p><strong>${esc(kantoor)}</strong> heeft zich aangemeld via de aansluitpagina.</p>
     <p>Contact: ${esc(contactNaam)}, ${esc(email)}${telefoon ? `, ${esc(telefoon)}` : ""}</p>
     <p>Sleutel getest: ${test.ok ? `werkt, ${test.aantal ?? 0} actieve objecten gevonden` : `werkt nog niet (${esc(test.fout || "onbekend")})`}.</p>
     <p>De woningen komen bij de eerstvolgende Realworks-ronde (elk uur) binnen; de eerste 5 Realworks-woningen zijn gratis.</p>`
  );
  await sendEmail({ aan: COMPANY.email, onderwerp: s.onderwerp, soort: "contact", html: s.html }).catch(() => {});

  return NextResponse.json({ ok: true, werkt: test.ok, aantal: test.aantal });
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
