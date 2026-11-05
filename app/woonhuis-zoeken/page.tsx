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
  const locale = getLocale();
  const aantal = getLiveListings("woonhuis").length;
  // Daaronder gewoon het eigen recreatieaanbod van Mooihuus, met filters.
  const recreatie = getLiveListings()
    .filter((l) => l.doel === "koop")
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined, omschrijving: "" }));
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
        {/* Rechts: wat je op Woonhuus vindt */}
        <div className="flex-[1_1_380px] rounded-3xl p-7 md:p-8 text-white relative overflow-hidden" style={{ background: "#1E3A5F" }}>
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="relative">
            <div className="inline-block bg-white rounded-xl px-3 py-1.5 font-display font-extrabold text-xl">
              <span style={{ color: "#2B5283" }}>Woon</span><span style={{ color: "#1B2430" }}>huus</span><span style={{ color: "#E8823B" }}>.nl</span>
            </div>
            <div className="font-display font-bold text-xl mt-4">Wat vind je op Woonhuus.nl?</div>
            <ul className="mt-3 space-y-2.5 list-none p-0 m-0">
              {[
                "Koopwoningen in heel Nederland",
                "Eengezinswoningen, appartementen en starterswoningen",
                "Aangeboden door makelaars en particulieren",
                "Je reactie gaat direct naar de aanbieder",
                "Gratis zoeken, bewaren en vergelijken",
              ].map((pt) => (
                <li key={pt} className="flex gap-2.5 items-start" style={{ color: "#D5E0EC" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8823B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0"><path d="M20 6 9 17l-5-5" /></svg>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
            {aantal > 0 && <p className="mt-4 mb-0 font-display font-semibold text-white">{aantal} {aantal === 1 ? "woning" : "woningen"} nu in het aanbod</p>}
          </div>
        </div>
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

      {/* Mooihuus of Woonhuus? */}
      <section className="mt-12">
        <h2 className="m-0 font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">Mooihuus of Woonhuus?</h2>
        <p className="text-grijs mt-1 mb-0">Elke woning staat op het platform waar de juiste kopers zoeken.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            { naam: "Mooihuus.nl", kl: "#2C6B45", zacht: "#EEF5EF", rand: "#C9E0CE", wat: "Recreatiewoningen", vb: "Chalets, bungalows, tiny houses en vakantiehuizen, vaak op een park.", pt: ["Kopen en huren", "Begeleiding van advertentie tot contract", "Huusmeesters voor onderhoud en meer"] },
            { naam: "Woonhuus.nl", kl: "#1E3A5F", zacht: "#EEF3F8", rand: "#D5E0EC", wat: "Gewone woningen", vb: "Woningen om permanent in te wonen, zoals een rijtjeshuis of appartement.", pt: ["Alleen koopwoningen", "Wij bieden de advertentie aan", "Contact direct met de aanbieder"] },
          ].map((k) => (
            <div key={k.naam} className="rounded-2xl border p-5" style={{ background: k.zacht, borderColor: k.rand }}>
              <div className="font-display font-extrabold text-xl" style={{ color: k.kl }}>{k.naam}</div>
              <div className="font-display font-semibold mt-1" style={{ color: k.kl }}>{k.wat}</div>
              <p className="text-sm text-grijs mt-1 mb-3">{k.vb}</p>
              <ul className="list-none p-0 m-0 space-y-1.5">
                {k.pt.map((x) => (
                  <li key={x} className="flex gap-2 items-start text-sm text-inkt">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={k.kl} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0"><path d="M20 6 9 17l-5-5" /></svg>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Hoe werkt het */}
      <section className="mt-12">
        <h2 className="m-0 font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">Zo werkt het</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { n: "1", t: "Zoek op Woonhuus.nl", d: "Bekijk koopwoningen in heel Nederland en filter op plaats, prijs en type." },
            { n: "2", t: "Bewaar je favorieten", d: "Met hetzelfde gemak als op Mooihuus. Je account werkt op beide platformen." },
            { n: "3", t: "Neem direct contact op", d: "Je bericht gaat rechtstreeks naar de makelaar of particulier die de woning verkoopt." },
          ].map((st) => (
            <div key={st.n} className="bg-white border border-lijn rounded-2xl p-5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-extrabold text-white" style={{ background: "#1E3A5F" }}>{st.n}</div>
              <div className="font-display font-bold text-lg text-bosgroen-dk mt-3">{st.t}</div>
              <p className="text-sm text-grijs mt-1 mb-0">{st.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3 flex-wrap">
          <a href={WOONHUUS_URL} className="btn text-base px-6 py-3">Naar Woonhuus.nl →</a>
          <a href="/plaatsen" className="btn btn-ghost text-base px-6 py-3">Zelf een woning plaatsen</a>
        </div>
      </section>

      <h2 id="aanbod" className="mt-12 mb-0 font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">Toch op zoek naar een plek om tot rust te komen?</h2>
      <p className="text-grijs mt-1">Bekijk het aanbod recreatiewoningen op Mooihuus, met begeleiding van advertentie tot contract.</p>
      <ListingsBrowser listings={recreatie} locale={locale} modus="koop" />
    </div>
  );
}
