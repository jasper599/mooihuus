import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { ListingsBrowser } from "@/components/ListingsBrowser";
import { MOOIHUUS_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Homepage van Woonhuus.nl (bereikt via de middleware op woonhuus.nl): het
// koopaanbod van gewone woningen, van makelaars en particulieren.
export default function WoonhuusHome() {
  const listings = getLiveListings("woonhuis")
    .filter((l) => l.doel === "koop")
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined, omschrijving: "" }));

  return (
    <div>
      <section className="bg-bosgroen-dk text-white rounded-2xl p-7 md:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="font-display font-semibold text-salie-lt text-sm mb-2">Koopwoningen in heel Nederland</div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">Elk huis in Nederland. Zonder gedoe.</h1>
          <p className="text-salie-lt mt-3">
            Eengezinswoningen, appartementen en starterswoningen te koop, aangeboden door makelaars en particulieren. Je reactie gaat direct naar de aanbieder van de woning.
          </p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <a href="#aanbod" className="btn">Bekijk het aanbod</a>
            <Link href="/te-koop" className="btn btn-ghost text-white border-white/40 hover:bg-white/10">Per provincie</Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-salie/20" />
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
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

      <ListingsBrowser listings={listings} locale="nl" modus="koop" woonhuis />

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
    </div>
  );
}
