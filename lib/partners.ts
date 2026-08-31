// Vaste Huusmeester-partners (echte samenwerkingen). Aanmeldingen van
// nieuwe vakmensen komen via het formulier binnen; deze staan curated.
export interface Partner {
  naam: string;
  vak: string;
  omschrijving: string;
  url: string;
  emoji: string;
}

export const HUUSMEESTERS_PARTNERS: Partner[] = [
  {
    naam: "Luyten Makelaardij",
    vak: "Recreatiemakelaar",
    omschrijving:
      "Dé recreatiemakelaar van Nederland. Ervaren begeleiding bij de aan- en verkoop van je recreatiewoning.",
    url: "https://www.luytenmakelaardij.nl",
    emoji: "🏘️",
  },
  {
    naam: "Verzeker uw recreatiewoning",
    vak: "Verzekeringen",
    omschrijving:
      "Specialist in verzekeringen voor recreatie- en vakantiewoningen. Goed verzekerd, zonder gedoe.",
    url: "https://www.verzekeruwrecreatiewoning.nl",
    emoji: "🛡️",
  },
  {
    naam: "Samen Financieel Sterker",
    vak: "Hypotheken & financiering",
    omschrijving:
      "Hypotheken en financiering speciaal voor vakantiewoningen. Deskundig advies op maat.",
    url: "https://samenfinancieelsterker.nl",
    emoji: "🏦",
  },
];

// Diensten/producten die je via de Huusmeesters kunt regelen.
export const HUUSMEESTERS_CATEGORIEEN: { icon: string; titel: string; tekst: string; href?: string }[] = [
  { icon: "🏘️", titel: "Makelaar", tekst: "Professionele begeleiding bij de aan- of verkoop van je recreatiewoning." },
  { icon: "⚖️", titel: "Notaris & overdracht", tekst: "Ervaren notariskantoren voor de eigendomsoverdracht en juridische afwikkeling." },
  { icon: "🛡️", titel: "Verzekeringen", tekst: "Je recreatiewoning goed verzekerd, afgestemd op recreatief gebruik." },
  { icon: "🏦", titel: "Hypotheek & financiering", tekst: "Financiering en hypotheekadvies speciaal voor vakantiewoningen." },
  { icon: "🧽", titel: "Schoonmaak & wissel", tekst: "Bezemschoon opgeleverd of een complete wisselschoonmaak tussen gasten." },
  { icon: "🌿", titel: "Tuin & buiten", tekst: "Heg, gras en borders netjes — ook als je er zelf niet vaak bent." },
  { icon: "🔧", titel: "Onderhoud & klussen", tekst: "Van een lekkende kraan tot het winterklaar maken van je woning." },
  { icon: "🛋️", titel: "Interieur & inventaris", tekst: "Inrichten, opfrissen of vervangen zodat je huus er top bij staat." },
  { icon: "📦", titel: "Bergingen", tekst: "Een berging of tuinhuis besteld en geplaatst bij je woning." },
  { icon: "♨️", titel: "Wellness", tekst: "Hottub, jacuzzi of sauna — regel extra luxe bij je recreatiewoning." },
  { icon: "❄️", titel: "Airco & klimaat", tekst: "Airco geplaatst in je recreatiewoning — heerlijk koel in de zomer, comfortabel warm in het tussenseizoen." },
  { icon: "🏗️", titel: "Nieuwbouw & maatwerk", tekst: "Een nieuwe recreatiewoning laten bouwen of op maat — van chalet tot vrijstaand vakantiehuis." },
  { icon: "🏡", titel: "Mantelzorgwoning", tekst: "Een mantelzorg- of maatwerkwoning plaatsen, zodat zorg en zelfstandigheid samengaan. Doe de gratis vergunningscheck.", href: "/mantelzorg" },
];

// Zoek een partner op naam (voor de klik-doorstuur/telling).
export function partnerByNaam(naam: string): Partner | undefined {
  return HUUSMEESTERS_PARTNERS.find((p) => p.naam === naam);
}

export function huusmeesterSlug(titel: string): string {
  return titel.toLowerCase().replace(/&/g, "en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export function getHuusmeesterCategorie(slug: string) {
  return HUUSMEESTERS_CATEGORIEEN.find((c) => huusmeesterSlug(c.titel) === slug);
}
