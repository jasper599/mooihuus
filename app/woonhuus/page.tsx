import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { HeroZoek } from "@/components/HeroZoek";
import { MOOIHUUS_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Homepage van Woonhuus.nl (bereikt via de middleware op woonhuus.nl): het
// koopaanbod van gewone woningen, van makelaars en particulieren.
export default function WoonhuusHome() {
  const listings = getLiveListings("woonhuis")
    .filter((l) => l.doel === "koop")
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined, omschrijving: "" }));
  // Net binnen: de drie nieuwste woningen.
  const nieuw = [...listings].sort((a, b) => (b.aangemaakt || "").localeCompare(a.aangemaakt || "")).slice(0, 3);

  return (
    <div>
      <section className="bg-bosgroen-dk text-white rounded-2xl p-7 md:p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl flex flex-col gap-4">
          <div className="font-display font-semibold text-salie-lt text-sm">Koopwoningen in heel Nederland</div>
          <h1 className="m-0 font-display font-extrabold text-4xl md:text-5xl leading-[1.08]">Elk huis in Nederland. Zonder gedoe.</h1>
          <p className="m-0 text-salie-lt text-lg">
            Eengezinswoningen, appartementen en starterswoningen te koop, aangeboden door makelaars en particulieren.
          </p>
          <HeroZoek site="woonhuus" labels={{ waar: "Plaats, buurt, adres of postcode", placeholder: "Bijvoorbeeld Brunssum of 6445", maxPrijs: "Straal", zoeken: "Zoeken" }} />
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-salie/20" />
      </section>

      {nieuw.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline gap-3 mb-4">
            <h2 className="m-0 font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">Net binnen</h2>
            <a href="/te-koop" className="ml-auto font-semibold text-bosgroen hover:underline">Alle woningen →</a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nieuw.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Van makelaar of particulier", d: "Makelaars leveren hun aanbod automatisch aan vanuit hun eigen systeem; particulieren plaatsen hun woning zelf." },
          { t: "Direct contact", d: "Interesse? Je bericht gaat rechtstreeks naar de makelaar of particulier die de woning verkoopt." },
          { t: "Gratis zoeken", d: "Zoeken, bewaren en vergelijken is gratis. Je hebt geen account nodig." },
        ].map((u) => (
          <div key={u.t} className="card">
            <div className="font-display font-bold text-bosgroen-dk">{u.t}</div>
            <div className="text-sm text-grijs mt-1">{u.d}</div>
          </div>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3 items-center rounded-2xl border border-lijn bg-white p-5">
        <div className="flex-[1_1_300px]">
          <div className="font-display font-bold text-lg text-bosgroen-dk">Alle koopwoningen bekijken</div>
          <p className="text-sm text-grijs mt-1 mb-0">Zoek op plaats en straal en filter op prijs, oppervlakte, slaapkamers, energielabel en meer.</p>
        </div>
        <Link href="/te-koop" className="btn text-base px-6 py-3">Bekijk het aanbod →</Link>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <a href={`${MOOIHUUS_URL}/plaatsen?categorie=woonhuis`} className="card hover:shadow-md transition-shadow block">
          <div className="font-display font-bold text-lg text-bosgroen-dk">Uw woning verkopen?</div>
          <p className="text-sm text-grijs mt-1">Koppel via Kolibri of Realworks. Uw koopwoningen verschijnen vanzelf op Woonhuus.nl, uw recreatieaanbod op Mooihuus.nl. Particulier? Plaats uw woning zelf.</p>
          <span className="inline-block mt-3 font-semibold text-bosgroen">Meer informatie →</span>
        </a>
        <a href={MOOIHUUS_URL} className="card hover:shadow-md transition-shadow block">
          <div className="font-display font-bold text-lg text-bosgroen-dk">Liever een plek voor het weekend?</div>
          <p className="text-sm text-grijs mt-1">Recreatiewoningen, chalets en vakantiehuizen vind je op Mooihuus.nl, ons platform voor recreatief genieten.</p>
          <span className="inline-block mt-3 font-semibold text-bosgroen">Naar Mooihuus.nl →</span>
        </a>
      </section>
      <p className="mt-4 text-sm text-grijs">
        Benieuwd hoe Woonhuus en Mooihuus samenwerken? <a href="/over-mooihuus" className="font-semibold text-bosgroen hover:underline">Lees meer over ons zusterplatform Mooihuus →</a>
      </p>
    </div>
  );
}
