// ------------------------------------------------------------------
// Eenvoudige, gratis antispam voor de publieke formulieren (contact, lead,
// bezichtiging). Combineert drie signalen, zonder externe dienst en zonder
// wrijving voor echte bezoekers:
//
//   1) Honeypot  — een verborgen veld dat mensen niet zien maar bots wél
//                  invullen. Is het gevuld, dan is het een bot.
//   2) Tijdslot  — bots vullen een formulier in en versturen binnen een paar
//                  honderd milliseconden; een mens doet er seconden over.
//   3) Wartaal   — botgegenereerde namen/berichten zijn vaak één lange reeks
//                  zonder spaties met een grillig hoofdletterpatroon
//                  (bv. "KxYEySTAVRlokbpYDpAbX").
//
// De aanroepende route accepteert een spam-inzending "stil" (gewoon ok terug)
// maar doet er niets mee: geen mail, geen lead. Zo leert de bot niets.
// ------------------------------------------------------------------

export interface SpamInput {
  naam?: string;
  email?: string;
  bericht?: string;
  onderwerp?: string;
  honeypot?: string; // verborgen veld; hoort leeg te zijn
  ts?: number | string; // tijdstip (ms) waarop het formulier is geladen
}

// Detecteert een "wartaal-token": één lange reeks zonder spaties met veel
// wisselingen tussen hoofd- en kleine letters. Echte namen en berichten
// bevatten spaties en een normaal hoofdlettergebruik, dus dit levert vrijwel
// geen valse positieven op.
export function lijktWartaal(s: string): boolean {
  const w = (s || "").trim();
  if (w.length < 12) return false;
  if (/\s/.test(w)) return false; // echte invoer heeft (bijna) altijd spaties
  const letters = w.replace(/[^A-Za-z]/g, "");
  if (letters.length < 10) return false;
  let wissels = 0;
  for (let i = 1; i < w.length; i++) {
    const a = w[i - 1];
    const b = w[i];
    if (
      /[A-Za-z]/.test(a) &&
      /[A-Za-z]/.test(b) &&
      (a === a.toUpperCase()) !== (b === b.toUpperCase())
    ) {
      wissels++;
    }
  }
  return wissels >= 4;
}

function bevatLink(s: string): boolean {
  return /https?:\/\/|www\.|\[url|\bhref\b|\.ru\b|\.top\b|\.xyz\b/i.test(s || "");
}

// Spamscore: hoe hoger, hoe verdachter. Bij >= 2 weigeren we.
export function spamScore(input: SpamInput): number {
  let score = 0;
  const naam = (input.naam || "").trim();
  const bericht = (input.bericht || "").trim();
  const onderwerp = (input.onderwerp || "").trim();

  if (lijktWartaal(naam)) score += 2;
  if (lijktWartaal(bericht)) score += 2;
  if (lijktWartaal(onderwerp)) score += 1;
  if (bevatLink(bericht)) score += 1;
  // Bots vullen vaak exact dezelfde random string in meerdere velden.
  if (naam && naam === onderwerp) score += 1;

  // Te snel ingestuurd (bot vult en verstuurt vrijwel direct). Bewust een
  // ondersteunend signaal (+1, lage drempel) zodat een snel typende echte
  // bezoeker niet op tijd alléén wordt geweigerd.
  const ts = typeof input.ts === "string" ? parseInt(input.ts, 10) : input.ts;
  if (typeof ts === "number" && ts > 0) {
    const dt = Date.now() - ts;
    if (dt >= 0 && dt < 1500) score += 1;
  }

  return score;
}

// Centrale check: true = weigeren (spam).
export function isSpam(input: SpamInput): boolean {
  // Honeypot heeft altijd gelijk: is het verborgen veld gevuld, dan is het een bot.
  if ((input.honeypot || "").toString().trim() !== "") return true;
  return spamScore(input) >= 2;
}

// ------------------------------------------------------------------
// Strengere check voor aanmeldformulieren (nieuwsbrief, woning-alert). Die sturen
// een mail naar het opgegeven adres, dus bots misbruiken ze om vreemden te mailen.
// Weigert: geen of ongeldig laadtijdstip, binnen 3 s verstuurd, ouder dan 24 u,
// honeypot gevuld, wegwerp-/bekende spamdomeinen, te veel pogingen per IP of
// per adres. Stil weigeren (ok terug) zodat de bot niets leert.
// ------------------------------------------------------------------
const SPAM_DOMEINEN = /(@|\.)(mail\.ru|yandex\.(ru|com)|qq\.com|aliyun\.com|docomo\.ne\.jp|vtext\.com|mailinator\.com|guerrillamail\.com|10minutemail\.com|tempmail\.[a-z]+)$/i;

const perIp = new Map<string, number[]>();
const perAdres = new Map<string, number>();

function ipVan(req: Request): string {
  const f = req.headers.get("x-forwarded-for") || "";
  return (f.split(",")[0] || req.headers.get("x-real-ip") || "onbekend").trim();
}

export function isAanmeldSpam(req: Request, input: { email: string; honeypot?: string; ts?: number | string }): boolean {
  if ((input.honeypot || "").toString().trim() !== "") return true;
  const ts = typeof input.ts === "string" ? parseInt(input.ts, 10) : input.ts;
  if (typeof ts !== "number" || !Number.isFinite(ts) || ts <= 0) return true;
  const dt = Date.now() - ts;
  if (dt < 3000 || dt > 24 * 3600_000) return true;

  const email = (input.email || "").trim().toLowerCase();
  if (SPAM_DOMEINEN.test(email)) return true;
  // Gmail-truc met puntjes tussen elke letter (r.o.g.e.r…@gmail.com).
  const lokaal = email.split("@")[0] || "";
  if ((lokaal.match(/\./g) || []).length >= 4) return true;

  const nu = Date.now();
  // Hooguit 3 aanmeldingen per IP per uur.
  const ip = ipVan(req);
  const lijst = (perIp.get(ip) || []).filter((t) => nu - t < 3600_000);
  if (lijst.length >= 3) { perIp.set(ip, lijst); return true; }
  lijst.push(nu);
  perIp.set(ip, lijst);
  // Hooguit 1 aanmeldmail per adres per 24 uur.
  const laatst = perAdres.get(email) || 0;
  if (nu - laatst < 24 * 3600_000) return true;
  perAdres.set(email, nu);
  if (perAdres.size > 20000) perAdres.clear();
  if (perIp.size > 20000) perIp.clear();
  return false;
}
