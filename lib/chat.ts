// Kennisbank voor de chatbot. Zonder LLM-key beantwoordt de bot vragen op
// basis van trefwoorden (hieronder). Met een key gebruikt /api/chat een echte
// LLM met deze kennis als context — zie SYSTEM_PROMPT.

type Entry = { keywords: string[]; antwoord: string };

export const KENNIS: Entry[] = [
  {
    keywords: ["prijs", "prijzen", "kost", "kosten", "tarief", "betalen", "hoeveel", "duur"],
    antwoord:
      "Adverteren kost eenmalig per woning: Basis € 25, Plus € 49 of Premium € 79. Geen commissie over de verkoop. Losse opvallers (zoals ‘Omhoog’ € 1,95) koop je optioneel bij.",
  },
  {
    keywords: ["account", "registreren", "aanmelden", "inloggen", "profiel"],
    antwoord:
      "Je maakt gratis een account aan via ‘Registreren’. Daarmee plaats je woningen en beheer je je leads op je dashboard.",
  },
  {
    keywords: ["zakelijk", "organisatie", "bedrijf", "meerdere", "park", "makelaar account", "objecten"],
    antwoord:
      "Ja! Kies bij registreren voor een zakelijk account (met bedrijfsnaam). Daarmee beheer je meerdere objecten onder één profiel — ideaal voor organisaties, recreatieparken en makelaars.",
  },
  {
    keywords: ["verhuur", "verhuren", "huur", "belvilla", "boeken", "boeking"],
    antwoord:
      "Verhuren kan via onze partner Belvilla. Zij regelen de boekingen, betalingen en gasten; jij hoeft geen kalender of gastadministratie bij te houden. Mooihuus is zelf geen boekingsplatform.",
  },
  {
    keywords: ["lead", "leads", "reactie", "contact", "geïnteresseerd", "bericht"],
    antwoord:
      "Reacties van geïnteresseerden komen rechtstreeks bij jou binnen — per e-mail én in je dashboard. Mooihuus zit er niet tussen.",
  },
  {
    keywords: ["plaatsen", "adverteren", "hoe werkt", "aanbieden", "wizard", "foto"],
    antwoord:
      "Via ‘Plaats je huus’ doorloop je een korte wizard. De AI schrijft een nette tekst en geeft een prijsindicatie, je voegt foto’s toe, kiest een pakket en rekent af met iDEAL. Daarna staat je advertentie live.",
  },
  {
    keywords: ["ideal", "factuur", "bewijs", "betaalbewijs", "betaling"],
    antwoord:
      "Betalen gaat met iDEAL. Na betaling gaat je advertentie live en ontvang je automatisch een betalingsbewijs per e-mail, met factuurnummer en btw.",
  },
  {
    keywords: ["commissie", "courtage", "percentage"],
    antwoord: "Nee, je betaalt nooit commissie of courtage over de verkoop — alleen de vaste advertentieprijs.",
  },
  {
    keywords: ["makelaar", "kolibri"],
    antwoord:
      "Makelaarskantoren kunnen straks hun aanbod via Kolibri automatisch op Mooihuus zetten. Die koppeling volgt in een latere fase.",
  },
  {
    keywords: ["privacy", "avg", "veilig", "gegevens", "data"],
    antwoord:
      "We gaan zorgvuldig met je gegevens om conform de AVG. Meer lees je in onze privacyverklaring onderaan de site.",
  },
  {
    keywords: ["makelaar zelf", "bemiddel", "wat is mooihuus", "wie zijn jullie"],
    antwoord:
      "Mooihuus is het onafhankelijke platform waar je je recreatiewoning zelf in de etalage zet — te koop of te huur. We zijn geen makelaar en geen partij bij de koop; jij houdt de regie.",
  },
  {
    keywords: ["contact", "mailen", "bereiken", "telefoon", "helpen", "hulp"],
    antwoord: "Je bereikt ons op info@mooihuus.nl — we helpen je graag verder.",
  },
];

export const GROET =
  "Hoi! Ik ben de Huus-hulp 🌲 Ik help je graag met vragen over adverteren, prijzen, je account of verhuur. Waar kan ik je mee helpen?";

export const FALLBACK =
  "Goede vraag! Daar heb ik zo geen kant-en-klaar antwoord op. Kijk eens bij de veelgestelde vragen (/faq), of mail ons op info@mooihuus.nl — dan helpen we je snel verder.";

export function lokaalAntwoord(vraag: string): string {
  const q = vraag.toLowerCase();
  let best: { score: number; antwoord: string } | null = null;
  for (const e of KENNIS) {
    const score = e.keywords.reduce((s, k) => (q.includes(k) ? s + 1 : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, antwoord: e.antwoord };
  }
  return best ? best.antwoord : FALLBACK;
}

export const SYSTEM_PROMPT = `Je bent de "Huus-hulp", de vriendelijke chatassistent van Mooihuus.nl,
het onafhankelijke Nederlandse platform waar particulieren en organisaties hun recreatiewoning zelf
te koop of te huur adverteren. Toon: warm, nuchter, behulpzaam, je/jij, korte antwoorden in het
Nederlands. Belangrijke feiten:
- Adverteren kost eenmalig: Basis €25, Plus €49, Premium €79. Geen commissie/courtage.
- Betalen met iDEAL; betalingsbewijs per e-mail.
- Leads komen rechtstreeks bij de eigenaar (mail + dashboard).
- Verhuur loopt via partner Belvilla (geen eigen boekingsplatform).
- Zakelijke accounts kunnen meerdere objecten onder één profiel beheren.
- Mooihuus is geen makelaar en geen partij bij de koop.
Weet je iets niet zeker, verwijs dan naar /faq of info@mooihuus.nl. Verzin geen prijzen of beloftes.`;
