import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { ListingsBrowser } from "@/components/ListingsBrowser";
import { ListingCard } from "@/components/ListingCard";
import { HeroZoek } from "@/components/HeroZoek";
import { getLocale } from "@/lib/i18n-server";
import { t, localeHref, Locale } from "@/lib/i18n";
import { WONINGTYPES, typeSlug, isType } from "@/lib/woningtypes";
import { WOONHUUS_URL } from "@/lib/site";
import { markeerHuidigeBlogAlsBasis } from "@/lib/nieuwsbrief";
import { markeerHuidigeMaandAlsBasis, stuurMaandrapportenIndienNieuweMaand } from "@/lib/maandrapport";

export const dynamic = "force-dynamic";

// Teksten van de vernieuwde homepage (NL / EN / DE).
const TXT: Record<Locale, Record<string, string>> = {
  nl: {
    tag: "Hét platform voor recreatiewoningen",
    titel: "Jouw plek om tot rust te komen.",
    sub: "Vakantiehuizen, chalets en recreatiewoningen in heel Nederland. Kopen, huren of zelf aanbieden.",
    waar: "Waar",
    ph: "Veluwe, Zeeland, Limburg",
    ikWil: "Ik wil",
    kopen: "Kopen",
    huren: "Huren",
    zoeken: "Zoeken",
    fotoAlt: "Uitgelichte recreatiewoning",
    nieuw: "Nieuw op Mooihuus",
    alle: "Bekijk alle recreatiewoningen",
    aanbod: "Het hele aanbod",
    mkTitel: "Makelaar? Je recreatieaanbod staat er automatisch op.",
    mkSub: "Koppel via Kolibri of Realworks, voor een vast bedrag per woning per jaar. Je gewone koopwoningen verschijnen vanzelf op ons zusterplatform Woonhuus.nl.",
    mkCta: "Aansluiten als makelaar",
    woonhuis: "Op zoek naar een gewoon woonhuis? Kijk op Woonhuus.nl",
    woningen: "woningen",
  },
  en: {
    tag: "The platform for holiday homes",
    titel: "Your place to unwind.",
    sub: "Holiday homes, chalets and recreational homes across the Netherlands. Buy, rent or list your own.",
    waar: "Where",
    ph: "Veluwe, Zeeland, Limburg",
    ikWil: "I want to",
    kopen: "Buy",
    huren: "Rent",
    zoeken: "Search",
    fotoAlt: "Featured holiday home",
    nieuw: "New on Mooihuus",
    alle: "View all holiday homes",
    aanbod: "All listings",
    mkTitel: "Estate agent? Your holiday homes appear automatically.",
    mkSub: "Connect via Kolibri or Realworks for a fixed fee per home per year. Regular homes for sale appear on our sister platform Woonhuus.nl.",
    mkCta: "Connect as an agent",
    woonhuis: "Looking for a regular home? Visit Woonhuus.nl",
    woningen: "homes",
  },
  de: {
    tag: "Die Plattform für Ferienhäuser",
    titel: "Dein Ort zum Abschalten.",
    sub: "Ferienhäuser, Chalets und Freizeitwohnungen in den ganzen Niederlanden. Kaufen, mieten oder selbst anbieten.",
    waar: "Wo",
    ph: "Veluwe, Zeeland, Limburg",
    ikWil: "Ich möchte",
    kopen: "Kaufen",
    huren: "Mieten",
    zoeken: "Suchen",
    fotoAlt: "Hervorgehobenes Ferienhaus",
    nieuw: "Neu auf Mooihuus",
    alle: "Alle Ferienhäuser ansehen",
    aanbod: "Das gesamte Angebot",
    mkTitel: "Makler? Ihre Ferienimmobilien erscheinen automatisch.",
    mkSub: "Verbinden Sie sich über Kolibri oder Realworks, für einen festen Betrag pro Objekt und Jahr. Normale Kaufobjekte erscheinen auf unserer Schwesterplattform Woonhuus.nl.",
    mkCta: "Als Makler anschließen",
    woonhuis: "Auf der Suche nach einem normalen Haus? Besuchen Sie Woonhuus.nl",
    woningen: "Objekte",
  },
};

// Vier categorieën bovenaan (bestaande type-pagina's).
const CATEGORIEEN = [
  { naam: "Chalet", sub: { nl: "Op een vakantiepark", en: "On a holiday park", de: "Auf einem Ferienpark" } },
  { naam: "Vrijstaand vakantiehuis", sub: { nl: "Ruimte en privacy", en: "Space and privacy", de: "Raum und Privatsphäre" } },
  { naam: "Bungalow", sub: { nl: "Gelijkvloers en onderhoudsarm", en: "Single storey, low maintenance", de: "Ebenerdig und pflegeleicht" } },
  { naam: "Tiny house", sub: { nl: "Klein en duurzaam", en: "Small and sustainable", de: "Klein und nachhaltig" } },
];

export default function Home({ searchParams }: { searchParams?: { q?: string } }) {
  // Nieuwsbrief: eerste keer een basislijn zetten (geen oude artikelen sturen).
  // Verzenden gaat alleen bewust via /api/beheer/nieuwsbrief.
  markeerHuidigeBlogAlsBasis();
  // Maandrapport: automatisch één keer per maand naar alle makelaars.
  markeerHuidigeMaandAlsBasis();
  stuurMaandrapportenIndienNieuweMaand().catch(() => {});

  const locale = getLocale();
  const T = TXT[locale] || TXT.nl;
  const koop = getLiveListings().filter((l) => l.doel === "koop");

  // Alleen de eerste foto en geen (lange) omschrijving meesturen: scheelt fors.
  const listings = koop.map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined, omschrijving: "" }));

  // Heldfoto: eerst een uitgelichte woning met foto, anders de nieuwste met foto.
  const metFoto = koop.filter((l) => !l.externalUrl && l.fotos && l.fotos.length);
  const held = metFoto.find((l) => l.uitgelicht) || metFoto[0];

  // Nieuw op Mooihuus: de drie nieuwste eigen woningen met foto.
  const nieuw = [...metFoto]
    .sort((a, b) => (b.aangemaakt || "").localeCompare(a.aangemaakt || ""))
    .slice(0, 3)
    .map((l) => ({ ...l, fotos: [l.fotos![0]], omschrijving: "" }));

  return (
    <div>
      {/* Held: tekst en zoekvak links, foto rechts */}
      <section className="flex flex-wrap gap-8 items-center pt-2">
        <div className="flex-[1_1_440px] flex flex-col gap-4">
          <p className="m-0 text-sm font-semibold tracking-[0.08em] uppercase text-bosgroen">{T.tag}</p>
          <h1 className="m-0 font-display font-extrabold text-4xl md:text-5xl leading-[1.08] text-bosgroen-dk">{T.titel}</h1>
          <p className="m-0 text-lg leading-relaxed text-grijs">{T.sub}</p>
          <HeroZoek
            site="mooihuus"
            labels={{ waar: T.waar, placeholder: T.ph, ikWil: T.ikWil, kopen: T.kopen, huren: T.huren, zoeken: T.zoeken, prefix: locale === "nl" ? "" : `/${locale}` }}
          />
        </div>
        <div className="flex-[1_1_380px] h-[340px] rounded-3xl overflow-hidden bg-salie-lt relative">
          {held && (
            <Link href={localeHref(locale, `/aanbod/${held.id}`)} className="block w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={held.fotos![0]} alt={held.titel || T.fotoAlt} className="w-full h-full object-cover" />
              <span className="absolute bottom-3 left-3 right-3 bg-white/90 rounded-xl px-3 py-2 text-sm font-display font-semibold text-bosgroen-dk truncate">
                {held.titel}
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Vier categorieën */}
      <section className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {CATEGORIEEN.map((c) => {
          const wt = WONINGTYPES.find((w) => w.naam === c.naam)!;
          const n = koop.filter((l) => isType(l.type, c.naam)).length;
          return (
            <Link
              key={c.naam}
              href={localeHref(locale, `/type/${typeSlug(c.naam)}`)}
              className="bg-white border border-lijn rounded-2xl p-5 flex flex-col gap-1.5 hover:shadow-md transition-shadow"
            >
              <span className="font-display font-bold text-lg text-bosgroen-dk">{wt.mv}</span>
              <span className="text-sm text-grijs">{c.sub[locale] || c.sub.nl}</span>
              <span className="text-xs font-semibold text-bosgroen mt-1">{n} {T.woningen}</span>
            </Link>
          );
        })}
      </section>

      {/* Nieuw op Mooihuus */}
      {nieuw.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline gap-3 mb-4">
            <h2 className="m-0 font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">{T.nieuw}</h2>
            <a href="#aanbod" className="ml-auto font-semibold text-bosgroen hover:underline">{T.alle} →</a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nieuw.map((l) => <ListingCard key={l.id} listing={l} locale={locale} />)}
          </div>
        </section>
      )}

      {/* Het hele aanbod, met filters en kaart */}
      <h2 className="mt-12 mb-0 font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">{T.aanbod}</h2>
      <ListingsBrowser listings={listings} locale={locale} modus="koop" initialQ={searchParams?.q ? String(searchParams.q) : ""} />

      {/* Makelaars */}
      <section className="mt-12 rounded-3xl bg-bosgroen-dk text-white p-7 md:p-10 flex flex-wrap gap-6 items-center">
        <div className="flex-[1_1_420px]">
          <h2 className="m-0 font-display font-extrabold text-2xl md:text-3xl">{T.mkTitel}</h2>
          <p className="mt-2 mb-0 text-salie-lt leading-relaxed">{T.mkSub}</p>
        </div>
        <Link href={localeHref(locale, "/contact?onderwerp=Aansluiten%20als%20makelaar")} className="btn text-base px-6 py-3">{T.mkCta}</Link>
      </section>

      {/* Waarom Mooihuus */}
      <section className="mt-12">
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk text-center">{t(locale, "usp.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-5">
          {[
            { e: "💶", t: "usp.1t", d: "usp.1d" },
            { e: "📩", t: "usp.2t", d: "usp.2d" },
            { e: "🌲", t: "usp.3t", d: "usp.3d" },
            { e: "🤝", t: "usp.4t", d: "usp.4d" },
            { e: "🧰", t: "usp.5t", d: "usp.5d" },
            { e: "🔔", t: "usp.6t", d: "usp.6d" },
          ].map((u) => (
            <div key={u.t} className="card flex gap-3 items-start">
              <div className="w-11 h-11 rounded-xl bg-salie-lt flex items-center justify-center text-xl shrink-0">{u.e}</div>
              <div>
                <div className="font-display font-bold text-bosgroen-dk">{t(locale, u.t)}</div>
                <div className="text-sm text-grijs mt-0.5">{t(locale, u.d)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link
        href={localeHref(locale, "/fotografie")}
        className="mt-8 block rounded-2xl bg-creme border border-salie p-5 sm:p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex gap-4 items-center flex-wrap">
          <div className="text-3xl">📸</div>
          <div className="flex-1 min-w-[220px]">
            <div className="font-display font-bold text-bosgroen-dk">{t(locale, "foto.homeTitel")}</div>
            <div className="text-sm text-grijs">{t(locale, "foto.homeSub")}</div>
          </div>
          <span className="btn btn-green text-sm">{t(locale, "foto.homeCta")} →</span>
        </div>
      </Link>

      {/* Liever huren? Door naar de aparte verhuurpagina "Huusje Huren". */}
      <Link
        href={localeHref(locale, "/verhuur")}
        className="mt-8 block rounded-2xl bg-bosgroen text-white p-5 sm:p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex gap-4 items-center flex-wrap">
          <div className="text-3xl">⛱️</div>
          <div className="flex-1 min-w-[220px]">
            <div className="font-display font-extrabold text-xl">Liever even weg? Huusje Huren</div>
            <div className="text-salie-lt text-sm mt-0.5">Vakantiewoningen te huur op de mooiste parken van Nederland, via onze verhuurpartners.</div>
          </div>
          <span className="btn bg-white text-bosgroen-dk hover:bg-white/90 text-sm">Bekijk het huuraanbod →</span>
        </div>
      </Link>

      {locale === "nl" && (
        <a href={WOONHUUS_URL} className="mt-8 flex flex-wrap gap-3 items-center rounded-2xl border border-lijn bg-white p-5 hover:shadow-md transition-shadow">
          <span className="font-display font-bold text-bosgroen-dk">{T.woonhuis}</span>
          <span className="ml-auto font-semibold text-bosgroen">→</span>
        </a>
      )}
    </div>
  );
}
