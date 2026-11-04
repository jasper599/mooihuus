import type { Metadata } from "next";
import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { WOONHUUS_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Op zoek naar een gewoon woonhuis? Kijk op Woonhuus.nl",
  description: "Mooihuus is het platform voor recreatiewoningen. Gewone koopwoningen vind je in ons buurhuus: Woonhuus.nl.",
  alternates: { canonical: "/woonhuis-zoeken" },
};

// Verwijspagina op Mooihuus.nl: wie een gewone woning zoekt, hoort op Woonhuus.nl.
export default function WoonhuisZoeken() {
  const aantal = getLiveListings("woonhuis").length;
  return (
    <div className="max-w-4xl mx-auto">
      <section className="rounded-2xl overflow-hidden border border-lijn bg-white grid md:grid-cols-2">
        <div className="p-7 md:p-10">
          <div className="font-display font-semibold text-bosgroen text-sm mb-2">Van Mooihuus naar Woonhuus</div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight text-bosgroen-dk">Op zoek naar een gewoon woonhuis?</h1>
          <p className="text-grijs mt-3">
            Mooihuus is helemaal gericht op recreatiewoningen: chalets, bungalows en vakantiehuizen. Voor eengezinswoningen,
            appartementen en starterswoningen die te koop staan, hebben we een buurhuus: <strong>Woonhuus.nl</strong>.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <a href={WOONHUUS_URL} className="btn">Naar Woonhuus.nl →</a>
            <Link href="/" className="btn btn-green">Bekijk recreatiewoningen</Link>
          </div>
        </div>
        <div className="p-7 md:p-10 flex flex-col justify-center gap-3" style={{ background: "#1E3A5F", color: "#fff" }}>
          <div className="font-display font-extrabold text-2xl">
            <span style={{ color: "#D5E0EC" }}>Woon</span>huus<span style={{ color: "#E8823B" }}>.nl</span>
          </div>
          <p style={{ color: "#D5E0EC" }}>Koopwoningen in heel Nederland, aangeboden door makelaars en particulieren.</p>
          {aantal > 0 && <p className="font-display font-bold">{aantal} {aantal === 1 ? "woning" : "woningen"} in het aanbod</p>}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
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

      <Link href="/" className="mt-8 block rounded-2xl bg-bosgroen text-white p-6 md:p-8 hover:shadow-md transition-shadow">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="font-display font-extrabold text-2xl">Toch op zoek naar een plek om tot rust te komen?</div>
            <div className="text-salie-lt mt-1">Chalets, bungalows en vakantiehuizen om recreatief van te genieten, met begeleiding van Mooihuus van advertentie tot contract.</div>
          </div>
          <span className="btn bg-white text-bosgroen-dk hover:bg-white/90 text-base px-6 py-3">Bekijk het aanbod recreatiewoningen →</span>
        </div>
      </Link>
    </div>
  );
}
