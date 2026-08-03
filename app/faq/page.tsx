import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import { Locale, localeHref } from "@/lib/i18n";

type QA = { v: string; a: string };
type Groep = { titel: string; items: QA[] };
type Content = { title: string; intro: string; cta: string; ctaBtn: string; groepen: Groep[] };

const CONTENT: Record<Locale, Content> = {
  nl: {
    title: "Veelgestelde vragen",
    intro: "Kort antwoord op wat mensen ons het vaakst vragen.",
    cta: "Klaar om te beginnen?",
    ctaBtn: "Plaats je huus",
    groepen: [
      { titel: "Algemeen", items: [
        { v: "Wat is Mooihuus?", a: "Het onafhankelijke platform waar je je recreatiewoning zelf in de etalage zet — te koop of te huur. Zelf de regie, met hulp binnen handbereik." },
        { v: "Is Mooihuus een makelaar?", a: "Nee. Mooihuus is een advertentieplatform en geen partij bij de koop of huur. Je houdt zelf de regie." },
        { v: "Wat kost adverteren?", a: "Eenmalig per advertentie: Basis € 25, Plus € 49 of Premium € 79. Geen commissie over de verkoop. Vanaf 5 objecten krijg je 15% korting, vanaf 10 objecten 25%." },
      ]},
      { titel: "Account & meerdere objecten", items: [
        { v: "Kan ik meerdere woningen plaatsen?", a: "Ja. Je plaatst per object een advertentie en beheert ze allemaal onder hetzelfde account." },
        { v: "Wat is een zakelijk account?", a: "Voor organisaties, parken en makelaars die meerdere objecten aanbieden, met bedrijfsnaam en volumekorting vanaf 5 objecten." },
      ]},
      { titel: "Betalen & leads", items: [
        { v: "Hoe betaal ik?", a: "Met iDEAL. Na betaling gaat je advertentie live en ontvang je een betalingsbewijs per e-mail." },
        { v: "Hoe komen reacties binnen?", a: "Rechtstreeks bij jou — per e-mail én in je dashboard. Mooihuus zit er niet tussen." },
        { v: "Kan ik mijn woning verhuren?", a: "Ja, via onze partner Belvilla. Zij regelen boekingen en betalingen; jij houdt geen kalender bij." },
      ]},
    ],
  },
  en: {
    title: "Frequently asked questions",
    intro: "Short answers to what people ask us most.",
    cta: "Ready to start?",
    ctaBtn: "List your huus",
    groepen: [
      { titel: "General", items: [
        { v: "What is Mooihuus?", a: "The independent platform where you list your holiday home yourself — for sale or for rent. You stay in control, with help close by." },
        { v: "Is Mooihuus an estate agent?", a: "No. Mooihuus is a listing platform and not a party to the sale or rental. You stay in control." },
        { v: "What does listing cost?", a: "A one-off fee per listing: Basic € 25, Plus € 49 or Premium € 79. No sales commission. From 5 objects you get 15% off, from 10 objects 25%." },
      ]},
      { titel: "Account & multiple objects", items: [
        { v: "Can I list multiple homes?", a: "Yes. You create one listing per object and manage them all under the same account." },
        { v: "What is a business account?", a: "For organisations, parks and agents offering multiple objects, with a company name and volume discount from 5 objects." },
      ]},
      { titel: "Payments & leads", items: [
        { v: "How do I pay?", a: "With iDEAL. After payment your listing goes live and you receive a payment receipt by email." },
        { v: "How do enquiries arrive?", a: "Straight to you — by email and in your dashboard. Mooihuus doesn't sit in between." },
        { v: "Can I rent out my home?", a: "Yes, via our partner Belvilla. They handle bookings and payments; you keep no calendar." },
      ]},
    ],
  },
  de: {
    title: "Häufig gestellte Fragen",
    intro: "Kurze Antworten auf die häufigsten Fragen.",
    cta: "Bereit loszulegen?",
    ctaBtn: "Huus inserieren",
    groepen: [
      { titel: "Allgemein", items: [
        { v: "Was ist Mooihuus?", a: "Die unabhängige Plattform, auf der du dein Ferienhaus selbst einstellst — zum Verkauf oder zur Vermietung. Du behältst die Regie, mit Hilfe in Reichweite." },
        { v: "Ist Mooihuus ein Makler?", a: "Nein. Mooihuus ist eine Inserate-Plattform und keine Partei beim Kauf oder der Miete. Du behältst die Regie." },
        { v: "Was kostet ein Inserat?", a: "Einmalig pro Inserat: Basis 25 €, Plus 49 € oder Premium 79 €. Keine Verkaufsprovision. Ab 5 Objekten 15% Rabatt, ab 10 Objekten 25%." },
      ]},
      { titel: "Konto & mehrere Objekte", items: [
        { v: "Kann ich mehrere Häuser inserieren?", a: "Ja. Du erstellst pro Objekt ein Inserat und verwaltest alle unter demselben Konto." },
        { v: "Was ist ein Geschäftskonto?", a: "Für Organisationen, Parks und Makler mit mehreren Objekten, inkl. Firmenname und Mengenrabatt ab 5 Objekten." },
      ]},
      { titel: "Zahlung & Anfragen", items: [
        { v: "Wie bezahle ich?", a: "Mit iDEAL. Nach der Zahlung geht dein Inserat online und du erhältst einen Zahlungsbeleg per E-Mail." },
        { v: "Wie kommen Anfragen an?", a: "Direkt zu dir — per E-Mail und im Dashboard. Mooihuus sitzt nicht dazwischen." },
        { v: "Kann ich mein Haus vermieten?", a: "Ja, über unseren Partner Belvilla. Sie regeln Buchungen und Zahlungen; du führst keinen Kalender." },
      ]},
    ],
  },
};

export const metadata: Metadata = {
  title: "Veelgestelde vragen",
  description: "Antwoorden over adverteren, prijzen, accounts, betalen, leads en verhuur op Mooihuus.",
};

export default function Faq() {
  const locale = getLocale();
  const c = CONTENT[locale];
  const alle = c.groepen.flatMap((g) => g.items);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: alle.map((qa) => ({
      "@type": "Question",
      name: qa.v,
      acceptedAnswer: { "@type": "Answer", text: qa.a },
    })),
  };

  return (
    <div className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">{c.title}</h1>
      <p className="text-grijs mb-6">{c.intro}</p>

      {c.groepen.map((g) => (
        <section key={g.titel} className="mb-6">
          <h2 className="font-display font-bold text-lg text-inkt mb-2">{g.titel}</h2>
          <div className="space-y-2">
            {g.items.map((qa) => (
              <details key={qa.v} className="card group">
                <summary className="font-display font-semibold text-bosgroen-dk cursor-pointer list-none flex justify-between items-center">
                  {qa.v}
                  <span className="text-oranje-dk group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <div className="text-[0.95rem] text-inkt mt-2">{qa.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="card bg-creme flex items-center justify-between flex-wrap gap-3">
        <div className="font-display font-semibold text-bosgroen-dk">{c.cta}</div>
        <Link href={localeHref(locale, "/plaatsen")} className="btn">{c.ctaBtn}</Link>
      </div>
    </div>
  );
}
