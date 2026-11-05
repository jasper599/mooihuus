import type { Metadata } from "next";
import { getLiveListings } from "@/lib/db";
import { ListingsBrowser } from "@/components/ListingsBrowser";
import { getLocale } from "@/lib/i18n-server";
import { WOONHUUS_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Op zoek naar een gewoon woonhuis? Kijk op Woonhuus.nl",
  description: "Mooihuus is het platform voor recreatiewoningen. Gewone koopwoningen vind je op ons zusterplatform Woonhuus.nl.",
  alternates: { canonical: "/woonhuis-zoeken" },
};

// Verwijspagina op Mooihuus.nl: wie een gewone woning zoekt, hoort op Woonhuus.nl.
export default function WoonhuisZoeken() {
  const aantal = getLiveListings("woonhuis").length;
  const locale = getLocale();
  // Daaronder gewoon het eigen recreatieaanbod van Mooihuus, met filters.
  const recreatie = getLiveListings()
    .filter((l) => l.doel === "koop")
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined, omschrijving: "" }));
  const voorbeeld = getLiveListings("woonhuis").find((l) => l.fotos && l.fotos.length);
  return (
    <div>
      {/* Held in dezelfde stijl als de homepage: tekst links, Woonhuus rechts */}
      <section className="flex flex-wrap gap-8 items-center pt-2">
        <div className="flex-[1_1_440px] flex flex-col gap-4">
          <p className="m-0 text-sm font-semibold tracking-[0.08em] uppercase text-bosgroen">Ons zusterplatform</p>
          <h1 className="m-0 font-display font-extrabold text-4xl md:text-5xl leading-[1.08] text-bosgroen-dk">Op zoek naar een gewoon woonhuis?</h1>
          <p className="m-0 text-lg leading-relaxed text-grijs">
            Mooihuus is helemaal gericht op recreatiewoningen. Voor eengezinswoningen, appartementen en
            starterswoningen die te koop staan, hebben we <strong>Woonhuus.nl</strong>.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href={WOONHUUS_URL} className="btn text-base px-6 py-3">Naar Woonhuus.nl →</a>
            <a href="/zusterplatform-woonhuus" className="btn btn-ghost text-base px-6 py-3">Lees meer over Woonhuus</a>
          </div>
        </div>
        <a href={WOONHUUS_URL} className="flex-[1_1_380px] h-[340px] rounded-3xl overflow-hidden relative block" style={{ background: "#1E3A5F" }}>
          {voorbeeld ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={voorbeeld.fotos![0]} alt="" className="w-full h-full object-cover opacity-90" />
          ) : null}
          <div className="absolute top-4 left-4 bg-white/95 rounded-xl px-3 py-1.5 font-display font-extrabold text-xl">
            <span style={{ color: "#2B5283" }}>Woon</span><span style={{ color: "#1B2430" }}>huus</span><span style={{ color: "#E8823B" }}>.nl</span>
          </div>
          <span className="absolute bottom-3 left-3 right-3 bg-white/90 rounded-xl px-3 py-2 text-sm font-display font-semibold truncate" style={{ color: "#1E3A5F" }}>
            Koopwoningen van makelaars en particulieren{aantal > 0 ? ` · ${aantal} ${aantal === 1 ? "woning" : "woningen"}` : ""}
          </span>
        </a>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { t: "Zelfde vertrouwde basis", d: "Woonhuus.nl is van hetzelfde team als Mooihuus.nl. Je favorieten en zoekgemak werken hetzelfde." },
          { t: "Van makelaar of particulier", d: "Makelaars leveren hun aanbod automatisch aan, particulieren plaatsen hun woning zelf. Je reactie gaat direct naar de aanbieder." },
          { t: "Verschil in begeleiding", d: "Bij een recreatiewoning begeleidt Mooihuus je van advertentie tot contract. Op Woonhuus bieden we alleen de advertentie aan." },
        ].map((u) => (
          <div key={u.t} className="bg-white border border-lijn rounded-2xl p-5 flex flex-col gap-1.5">
            <span className="font-display font-bold text-lg text-bosgroen-dk">{u.t}</span>
            <span className="text-sm text-grijs">{u.d}</span>
          </div>
        ))}
      </section>

      <h2 id="aanbod" className="mt-12 mb-0 font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">Toch op zoek naar een plek om tot rust te komen?</h2>
      <p className="text-grijs mt-1">Bekijk het aanbod recreatiewoningen op Mooihuus, met begeleiding van advertentie tot contract.</p>
      <ListingsBrowser listings={recreatie} locale={locale} modus="koop" />
    </div>
  );
}
