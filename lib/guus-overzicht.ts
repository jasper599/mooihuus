// Gedeeld Mooihuus-dagoverzicht — de "stand van zaken" die Guus 's ochtends
// naar Jasper mailt én die Max kort meeneemt in zijn ochtendbriefing.
//
// Bewust rustig: nieuwe aanvragen/leads, telefonische tickets, nieuwe betaalde
// plaatsingen en (eventueel) mislukte betalingen over een tijdvenster. Nooit
// fataal; bij een lege dag een vriendelijke "rustig"-regel.

import { getLeads, getPayments, getListing, getUser } from "./db";

// Leads met deze bron zijn telefonische tickets (via Guus), geen gewone aanvraag.
const TICKET_BRONNEN = new Set(["support-telefoon"]);

export interface GuusAanvraag {
  naam: string;
  bron: string;
  titel?: string;
}
export interface GuusTicket {
  naam: string;
  onderwerp: string;
}
export interface GuusPlaatsing {
  titel: string;
  pakket: string;
  bedrag: number;
  kantoor: string;
}
export interface GuusBetaling {
  omschrijving: string;
  bedrag: number;
}
export interface GuusOverzicht {
  sindsUren: number;
  aanvragen: GuusAanvraag[];
  tickets: GuusTicket[];
  plaatsingen: GuusPlaatsing[];
  betalingenOverig: GuusBetaling[];
  mislukt: GuusBetaling[];
  kort: string; // één zin, voor Max
}

function meervoud(n: number, enkel: string, meer: string): string {
  return `${n} ${n === 1 ? enkel : meer}`;
}

function ticketOnderwerp(bericht: string): string {
  const m = /Onderwerp:\s*(.+)/i.exec(bericht || "");
  return (m?.[1] || "melding").trim().slice(0, 80);
}

export function guusDagoverzicht(sindsUren = 24): GuusOverzicht {
  const grens = Date.now() - Math.max(1, sindsUren) * 3600_000;
  // Leads worden opgeslagen met toLocaleString("nl-NL") → "13-10-2026, 06:13:58",
  // wat new Date() niet kan parsen (Invalid Date → lead viel altijd buiten het
  // venster). Daarom beide formaten aan: ISO (toISOString) én het Nederlandse
  // DD-MM-YYYY-formaat.
  const parseDatum = (s?: string): number => {
    if (!s) return NaN;
    const str = String(s).trim();
    const nl = /^(\d{1,2})-(\d{1,2})-(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(str);
    if (nl) {
      const [, d, mo, y, h, mi, sec] = nl;
      return new Date(+y, +mo - 1, +d, +(h || 0), +(mi || 0), +(sec || 0)).getTime();
    }
    const t = new Date(str).getTime();
    return Number.isFinite(t) ? t : NaN;
  };
  const recent = (iso?: string): boolean => {
    const t = parseDatum(iso);
    return Number.isFinite(t) && t >= grens;
  };

  // Leads: splitsen in gewone aanvragen en telefonische tickets.
  const leads = getLeads().filter((l) => recent(l.datum));
  const aanvragen: GuusAanvraag[] = leads
    .filter((l) => !TICKET_BRONNEN.has(l.bron || ""))
    .map((l) => ({
      naam: l.naam || "Onbekend",
      bron: l.bron || "aanvraag",
      titel: l.listingId ? getListing(l.listingId)?.titel : undefined,
    }));
  const tickets: GuusTicket[] = leads
    .filter((l) => TICKET_BRONNEN.has(l.bron || ""))
    .map((l) => ({ naam: l.naam || "Onbekend", onderwerp: ticketOnderwerp(l.bericht) }));

  // Betalingen: nieuwe betaalde plaatsingen en overige betalingen.
  const betaald = getPayments().filter((p) => p.status === "paid" && recent(p.betaaldOp));
  const plaatsingen: GuusPlaatsing[] = betaald
    .filter((p) => (p.soort || "advertentie") === "advertentie")
    .map((p) => {
      const l = p.listingId ? getListing(p.listingId) : undefined;
      const u = getUser(p.userId);
      return {
        titel: l?.titel || "een woning",
        pakket: p.pakket,
        bedrag: p.bedrag,
        kantoor: u?.bedrijfsnaam || u?.naam || "een particulier",
      };
    });
  const betalingenOverig: GuusBetaling[] = betaald
    .filter((p) => (p.soort || "advertentie") !== "advertentie")
    .map((p) => ({ omschrijving: p.omschrijving || p.soort || "betaling", bedrag: p.bedrag }));

  // Mislukte betalingen (echte 'failed', geen afgebroken/verlopen).
  const mislukt: GuusBetaling[] = getPayments()
    .filter((p) => p.status === "failed" && recent(p.aangemaakt))
    .map((p) => ({ omschrijving: p.omschrijving || p.soort || "betaling", bedrag: p.bedrag }));

  // Korte zin voor Max.
  const delen: string[] = [];
  if (aanvragen.length) delen.push(meervoud(aanvragen.length, "nieuwe aanvraag", "nieuwe aanvragen"));
  if (plaatsingen.length) delen.push(meervoud(plaatsingen.length, "nieuwe plaatsing", "nieuwe plaatsingen"));
  if (tickets.length) delen.push(meervoud(tickets.length, "ticket", "tickets"));
  if (mislukt.length) delen.push(meervoud(mislukt.length, "mislukte betaling", "mislukte betalingen"));
  const kort = delen.length
    ? `Bij Mooihuus: ${delen.join(", ")}.`
    : "Bij Mooihuus is het rustig, niets bijzonders.";

  return { sindsUren, aanvragen, tickets, plaatsingen, betalingenOverig, mislukt, kort };
}

function euro(n: number): string {
  return "€ " + (Math.round((n || 0) * 100) / 100).toLocaleString("nl-NL");
}

// HTML-body voor de ochtendmail (los van renderSimpel-layout, die eromheen gaat).
export function guusOverzichtHtml(o: GuusOverzicht): string {
  const blok = (titel: string, items: string[]): string => {
    if (!items.length) return "";
    const li = items.map((x) => `<li style="margin:2px 0;">${x}</li>`).join("");
    return `<p style="margin:14px 0 4px;font-weight:600;color:#2F4A3C;">${titel}</p><ul style="margin:0 0 4px;padding-left:18px;color:#44524A;font-size:14px;">${li}</ul>`;
  };

  const esc = (s: string): string =>
    String(s).replace(/[&<>]/g, (c) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;" } as any)[c]));

  const delen = [
    blok(
      "Nieuwe betaalde plaatsingen",
      o.plaatsingen.map((p) => `${esc(p.titel)} — ${esc(p.pakket)} (${euro(p.bedrag)}) · ${esc(p.kantoor)}`)
    ),
    blok(
      "Nieuwe aanvragen & leads",
      o.aanvragen.map((a) => `${esc(a.naam)}${a.titel ? ` — ${esc(a.titel)}` : ""} <span style="color:#8A978E;">(${esc(a.bron)})</span>`)
    ),
    blok("Telefonische tickets", o.tickets.map((t) => `${esc(t.naam)} — ${esc(t.onderwerp)}`)),
    blok("Overige betalingen", o.betalingenOverig.map((b) => `${esc(b.omschrijving)} (${euro(b.bedrag)})`)),
    blok("Mislukte betalingen", o.mislukt.map((b) => `${esc(b.omschrijving)} (${euro(b.bedrag)})`)),
  ].filter(Boolean);

  const body = delen.length
    ? delen.join("")
    : `<p style="color:#44524A;font-size:14px;">Het was rustig — geen nieuwe aanvragen, plaatsingen of tickets in deze periode.</p>`;

  return `<p style="color:#44524A;font-size:14px;margin:0 0 6px;">Goedemorgen Jasper, hier is de Mooihuus-stand van de afgelopen ${o.sindsUren} uur.</p>${body}<p style="color:#8A978E;font-size:12px;margin-top:16px;">Automatisch samengesteld door Guus.</p>`;
}

// Gesproken samenvatting voor Guus (de stem) om hardop voor te lezen. Bewust
// in natuurlijke zinnen, kort en zonder opmaak — Guus leest dit letterlijk voor.
export function guusGesprokenTekst(o: GuusOverzicht): string {
  const n = (arr: unknown[]) => (arr ? arr.length : 0);
  const zinnen: string[] = [];

  if (n(o.aanvragen)) {
    const namen = o.aanvragen
      .slice(0, 5)
      .map((a) => (a.titel ? `${a.naam} voor ${a.titel}` : a.naam))
      .join(", ");
    zinnen.push(
      `${meervoud(o.aanvragen.length, "nieuwe aanvraag", "nieuwe aanvragen")}` +
        (namen ? `: ${namen}.` : ".")
    );
  }
  if (n(o.plaatsingen)) {
    const p = o.plaatsingen
      .slice(0, 5)
      .map((x) => `${x.titel} (${x.pakket}) van ${x.kantoor}`)
      .join(", ");
    zinnen.push(
      `${meervoud(o.plaatsingen.length, "nieuwe betaalde plaatsing", "nieuwe betaalde plaatsingen")}` +
        (p ? `: ${p}.` : ".")
    );
  }
  if (n(o.tickets)) {
    const t = o.tickets.slice(0, 5).map((x) => `${x.naam} over ${x.onderwerp}`).join(", ");
    zinnen.push(
      `${meervoud(o.tickets.length, "telefonisch ticket", "telefonische tickets")}` +
        (t ? `: ${t}.` : ".")
    );
  }
  if (n(o.mislukt)) {
    zinnen.push(
      `Let op: ${meervoud(o.mislukt.length, "mislukte betaling", "mislukte betalingen")}.`
    );
  }

  const kern = zinnen.length
    ? zinnen.join(" ")
    : "Het is rustig, geen nieuwe aanvragen, plaatsingen of tickets.";

  return (
    `Hier is de Mooihuus-stand van de afgelopen ${o.sindsUren} uur. ` +
    kern +
    (zinnen.length ? " Dat was het." : "")
  );
}
