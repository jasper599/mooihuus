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
  return (
    <div>
      <section className="rounded-2xl overflow-hidden border border-lijn bg-white grid md:grid-cols-[1.4fr_1fr]">
        <div className="p-6 md:p-8">
          <div className="font-display font-semibold text-bosgroen text-sm mb-2">Van Mooihuus naar Woonhuus</div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl leading-tight text-bosgroen-dk">Op zoek naar een gewoon woonhuis?</h1>
          <p className="text-grijs mt-3">
            Mooihuus is helemaal gericht op recreatiewoningen: chalets, bungalows en vakantiehuizen. Voor eengezinswoningen,
            appartementen en starterswoningen die te koop staan, hebben we een zusterplatform: <strong>Woonhuus.nl</strong>.
          </p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <a href={WOONHUUS_URL} className="btn">Naar Woonhuus.nl →</a>
            <a href="#aanbod" className="btn btn-green">Bekijk recreatiewoningen</a>
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center gap-2" style={{ background: "#1E3A5F", color: "#fff" }}>
          <div className="font-display font-extrabold text-2xl">
            <span style={{ color: "#D5E0EC" }}>Woon</span>huus<span style={{ color: "#E8823B" }}>.nl</span>
          </div>
          <p style={{ color: "#D5E0EC" }}>Koopwoningen in heel Nederland, aangeboden door makelaars en particulieren.</p>
          {aantal > 0 && <p className="font-display font-bold">{aantal} {aantal === 1 ? "woning" : "woningen"} in het aanbod</p>}
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          { t: "Zelfde vertrouwde basis", d: "Woonhuus.nl is van hetzelfde team als Mooihuus.nl. Je favorieten en zoekgemak werken hetzelfde." },
          { t: "Van makelaar of particulier", d: "Makelaars leveren hun aanbod automatisch aan, particulieren plaatsen hun woning zelf. Je reactie gaat direct naar de aanbieder." },
          { t: "Verschil in begeleiding", d: "Bij een recreatiewoning begeleidt Mooihuus je van advertentie tot contract, met de Huusmeesters. Op Woonhuus bieden we alleen de advertentie aan." },
        ].map((u) => (
          <div key={u.t} className="card">
            <div className="font-display font-bold text-bosgroen-dk">{u.t}</div>
            <p className="text-sm text-grijs mt-1">{u.d}</p>
          </div>
        ))}
      </section>

      <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk mt-10">Toch op zoek naar een plek om tot rust te komen?</h2>
      <p className="text-grijs mt-1">Bekijk het aanbod recreatiewoningen op Mooihuus, met begeleiding van advertentie tot contract.</p>
      <ListingsBrowser listings={recreatie} locale={locale} modus="koop" />
    </div>
  );
}
