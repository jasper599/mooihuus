import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zorgwoning.nl — mantelzorgwoningen in de tuin | Mooihuus-partner",
  description:
    "Zorgwoning.nl is partner van Mooihuus voor mantelzorgwoningen: kant-en-klare zorgwoningen in de tuin, koop of huur, vaak vergunningvrij. Doe de gratis vergunningscheck.",
  alternates: { canonical: "/huusmeesters/zorgwoning" },
};

const KENMERKEN: { icon: string; titel: string; tekst: string }[] = [
  { icon: "🏡", titel: "Compleet in de tuin", tekst: "Een volwaardige, zelfstandige woning naast je eigen huis — eigen voordeur, eigen plek, zorg dichtbij." },
  { icon: "📐", titel: "12 modellen, 40–82,5 m²", tekst: "Van compact tot ruim, ook rolstoeltoegankelijk. Op maat aan te passen aan de situatie en de bewoner." },
  { icon: "🔑", titel: "Koop of huur", tekst: "Kopen of huren kan allebei — je kiest wat past bij de duur van de zorg en je budget." },
  { icon: "⏱️", titel: "Vaak in één dag geplaatst", tekst: "'s Ochtends een leeg erf, 's avonds een woning. Prefab gebouwd en in één keer geplaatst." },
  { icon: "🌱", titel: "Energieneutraal", tekst: "Duurzaam en energiezuinig gebouwd, dus lage vaste lasten voor de bewoner." },
  { icon: "🤝", titel: "Alles in eigen beheer", tekst: "Ontwerp, productie, transport en plaatsing in eigen hand — met één vast aanspreekpunt van begin tot eind." },
];

export default function ZorgwoningProfiel() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/huusmeesters" className="text-sm text-grijs hover:text-bosgroen">← Terug naar Huusmeesters</Link>

      {/* Hero */}
      <div className="card mt-3 flex gap-4 items-start">
        <div className="w-14 h-14 rounded-2xl bg-salie-lt flex items-center justify-center text-3xl shrink-0">🏡</div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">Zorgwoning.nl</h1>
            <span className="inline-block bg-salie-lt text-bosgroen-dk font-display font-semibold text-xs px-3 py-1 rounded-full">Partner van Mooihuus</span>
          </div>
          <div className="text-xs font-semibold text-oranje-dk uppercase tracking-wide mt-1">Mantelzorgwoningen · zorgwoningen</div>
          <p className="text-grijs mt-2">
            Specialist in mantelzorg- en zorgwoningen: een complete, kant-en-klare woning in de tuin, zodat een
            dierbare dichtbij kan wonen met behoud van eigen zelfstandigheid. Via Mooihuus regel je de eerste stap —
            de gratis vergunningscheck — en Zorgwoning.nl helpt je verder van ontwerp tot plaatsing.
          </p>
        </div>
      </div>

      {/* Kenmerken */}
      <h2 className="font-display font-bold text-xl text-bosgroen-dk mt-8 mb-2">Wat Zorgwoning.nl doet</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {KENMERKEN.map((k) => (
          <div key={k.titel} className="card flex gap-3 items-start">
            <div className="w-11 h-11 rounded-xl bg-salie-lt flex items-center justify-center text-xl shrink-0">{k.icon}</div>
            <div>
              <div className="font-display font-bold text-bosgroen-dk">{k.titel}</div>
              <div className="text-sm text-grijs mt-0.5">{k.tekst}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Vergunningscheck-CTA — de enige volgende stap: eerst de check */}
      <div className="card mt-8 bg-bosgroen text-white">
        <div className="text-xs font-display font-semibold uppercase tracking-wider text-salie-lt">Gratis & indicatief · start hier</div>
        <h2 className="font-display font-extrabold text-2xl mt-1">Begin met de gratis vergunningscheck</h2>
        <p className="text-salie-lt mt-1.5 max-w-xl">
          In een paar vragen weet je of een mantelzorgwoning waarschijnlijk vergunningvrij in jouw tuin mag. Is het
          kansrijk en wil je verder? Dan brengen we je in contact met Zorgwoning.nl, die met je meedenkt over het
          ontwerp, het inmeten en de plaatsing.
        </p>
        <div className="mt-4">
          <Link href="/mantelzorg" className="btn bg-white text-bosgroen-dk hover:bg-white/90">Doe de vergunningscheck →</Link>
        </div>
      </div>

      {/* Zo werkt het / prijsindicatie */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="card">
          <div className="font-display font-bold text-bosgroen-dk text-sm">Zo werkt het</div>
          <p className="text-sm text-grijs mt-0.5">
            Je doet eerst de gratis check op Mooihuus. Vraag je daarna advies aan, dan pakken wij je aanvraag op en
            brengen we je in contact met Zorgwoning.nl — je stapt dus niet in het diepe, maar wordt persoonlijk verder
            geholpen.
          </p>
        </div>
        <div className="card">
          <div className="font-display font-bold text-bosgroen-dk text-sm">Prijsindicatie</div>
          <p className="text-sm text-grijs mt-0.5">
            Een nieuwe zorgwoning start rond de € 66.550 incl. btw en loopt op afhankelijk van model, maatwerk en
            afwerking. Ook tweedehands units en huur behoren tot de mogelijkheden — dat bespreek je in het adviesgesprek.
          </p>
        </div>
      </div>

      <p className="text-xs text-grijs mt-6">
        Zorgwoning.nl is de uitvoeringspartner van Mooihuus voor mantelzorgwoningen. De vergunningscheck is een
        indicatie op basis van de landelijke regels voor vergunningvrij bouwen; de gemeente beslist definitief.
      </p>
    </div>
  );
}
