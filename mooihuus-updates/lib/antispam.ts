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
