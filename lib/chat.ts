
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
  {
    keywords: ["overdrachtsbelasting", "overdracht", "belasting bij kopen", "8%", "8 procent", "10,4"],
    antwoord:
      "Bij de aankoop van een recreatiewoning (die niet je hoofdverblijf wordt) betaal je overdrachtsbelasting. Vanaf 1 januari 2026 is dat tarief verlaagd van 10,4% naar 8% van de koopsom. Wordt de woning je eigen hoofdverblijf, dan geldt 2%. Dit is algemene info; je notaris rekent het exacte bedrag voor jouw situatie uit.",
  },
  {
    keywords: ["kosten koper", "k.k.", "kk", "vrij op naam", "v.o.n.", "von", "bijkomende kosten", "notariskosten", "kadaster"],
    antwoord:
      "‘k.k.’ betekent kosten koper: bovenop de koopsom betaal jij als koper de bijkomende kosten — overdrachtsbelasting, notaris (leveringsakte, en bij een lening ook de hypotheekakte) en kadaster. Reken globaal op zo’n 8–10% extra. ‘v.o.n.’ (vrij op naam) zie je bij nieuwbouw: dan zitten die kosten al in de prijs en betaal je 21% btw in plaats van overdrachtsbelasting.",
  },
  {
    keywords: ["eigen grond", "erfpacht", "canon", "grond huren", "pacht"],
    antwoord:
      "Op een recreatiepark sta je op eigen grond óf op erfpacht (je huurt de grond van het park en betaalt jaarlijks canon). Eigen grond is vrijer en waardevaster; bij erfpacht kan de canon in de loop van de tijd stijgen. Vraag altijd de erfpachtvoorwaarden op vóór de koop.",
  },
  {
    keywords: ["permanent wonen", "permanent bewonen", "er wonen", "hoofdverblijf", "inschrijven", "bestemming", "bestemmingsplan"],
    antwoord:
      "Permanent wonen in een recreatiewoning mag lang niet overal — het hangt af van de bestemming en het beleid van de gemeente, en er wordt verschillend op gehandhaafd. Wil je er echt gaan wonen, controleer dan de bestemming en de gemeenteregels vóór je koopt.",
  },
  {
    keywords: ["parkkosten", "servicekosten", "jaarlijkse kosten", "bijdrage", "vve", "onderhoud park"],
    antwoord:
      "Op een park betaal je jaarlijkse park- of servicekosten voor onderhoud, voorzieningen en beheer. Die verschillen flink per park — vraag een overzicht van de afgelopen jaren op, zodat je weet wat je structureel kwijt bent.",
  },
  {
    keywords: ["financiering", "hypotheek", "lenen", "financieren", "nhg", "bank"],
    antwoord:
      "Niet elke bank financiert een recreatiewoning, en de voorwaarden wijken vaak af van een gewone hypotheek — vaak is er meer eigen geld nodig en geldt NHG meestal niet. Verdiep je hier vroeg in, vóór je een bod uitbrengt.",
  },
  {
    keywords: ["box 3", "vermogensbelasting", "belasting bezit", "belasting jaarlijks", "fictief rendement"],
    antwoord:
      "Een recreatiewoning die niet je hoofdverblijf is, valt in box 3 (vermogen). In 2026 rekent de Belastingdienst met een fictief rendement van circa 6% van de waarde, waarover je 36% belasting betaalt. Vanaf 2028 wil men overstappen op het werkelijke rendement. Reken deze jaarlijkse last mee en laat je voor jouw situatie adviseren.",
  },
  {
    keywords: ["bouwkundige keuring", "keuring", "staat woning", "isolatie", "onderhoud woning"],
    antwoord:
      "Recreatiewoningen zijn soms lichter gebouwd dan gewone huizen. Let op isolatie, het dak, houtrot en de leeftijd van de woning — een bouwkundige keuring is ook hier verstandig voordat je koopt.",
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
Nederlands.
 
Over Mooihuus:
- Adverteren kost eenmalig: Basis €25, Plus €49, Premium €79. Geen commissie/courtage.
- Betalen met iDEAL; betalingsbewijs per e-mail.
- Leads komen rechtstreeks bij de eigenaar (mail + dashboard).
- Verhuur loopt via partner Belvilla (geen eigen boekingsplatform).
- Zakelijke accounts kunnen meerdere objecten onder één profiel beheren.
- Mooihuus is geen makelaar en geen partij bij de koop.
 
Algemene kennis over recreatiewoningen (gebruik dit om inhoudelijke vragen te beantwoorden):
- Overdrachtsbelasting: bij aankoop van een recreatiewoning die niet je hoofdverblijf wordt, geldt vanaf 1 januari 2026 een tarief van 8% van de koopsom (dit was 10,4%). Wordt de woning je eigen hoofdverblijf, dan geldt 2%.
- Kosten koper (k.k.): de koper betaalt bovenop de koopsom de bijkomende kosten — overdrachtsbelasting, notaris (leveringsakte, en bij een lening de hypotheekakte) en kadaster, samen grofweg 8–10%. Vrij op naam (v.o.n.) zie je bij nieuwbouw: die kosten en 21% btw zitten al in de prijs; dan is er geen overdrachtsbelasting.
- Eigen grond vs. erfpacht: bij erfpacht huur je de grond van het park en betaal je jaarlijks canon (kan stijgen); eigen grond is vrijer en waardevaster.
- Permanent wonen mag lang niet overal; dit hangt af van de bestemming en het beleid van de gemeente. Adviseer dit vóór de koop te controleren.
- Park-/servicekosten: jaarlijkse bijdrage voor onderhoud, voorzieningen en beheer; verschilt per park.
- Financiering: niet elke bank financiert een recreatiewoning; vaak is er meer eigen geld nodig en geldt NHG meestal niet.
- Box 3: een recreatiewoning die niet je hoofdverblijf is, valt in box 3. In 2026 geldt een fictief rendement van circa 6%, waarover 36% belasting. Een nieuw stelsel op werkelijk rendement is beoogd vanaf 2028.
- Verhuur kan via Belvilla, maar niet elk park of elke gemeente staat verhuur toe.
- Een bouwkundige keuring is verstandig; recreatiewoningen zijn soms lichter gebouwd.
 
Belangrijk: dit is algemene informatie, geen persoonlijk fiscaal of juridisch advies. Bedragen en tarieven zijn indicatief, kunnen wijzigen en verschillen per situatie — verwijs voor de eigen situatie naar een notaris of belastingadviseur. Weet je iets niet zeker, verwijs dan naar /faq of info@mooihuus.nl. Verzin geen prijzen of beloftes.`;
 
