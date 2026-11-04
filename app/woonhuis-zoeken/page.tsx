import type { Metadata } from "next";
import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { WOONHUUS_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Op zoek naar een gewoon woonhuis? Kijk op Woonhuus.nl",
  description: "Mooihuus is het platform voor recreatiewoningen. Gewone koop- en huurwoningen vind je op ons zusterplatform Woonhuus.nl.",
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
            appartementen en starterswoningen hebben we een eigen platform: <strong>Woonhuus.nl</strong>.
          </p>
          <a href={WOONHUUS_URL} className="btn mt-6">Naar Woonhuus.nl →</a>
        </div>
        <div className="p-7 md:p-10 flex flex-col justify-center gap-3" style={{ background: "#1E3A5F", color: "#fff" }}>
          <div className="font-display font-extrabold text-2xl">
            <span style={{ color: "#D5E0EC" }}>Woon</span>huus<span style={{ color: "#E8823B" }}>.nl</span>
          </div>
          <p style={{ color: "#D5E0EC" }}>Koop- en huurwoningen in heel Nederland, rechtstreeks van de makelaar.</p>
          {aantal > 0 && <p className="font-display font-bold">{aantal} {aantal === 1 ? "woning" : "woningen"} in het aanbod</p>}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { t: "Zelfde vertrouwde basis", d: "Woonhuus.nl is van hetzelfde team als Mooihuus.nl. Je favorieten en zoekgemak werken hetzelfde." },
          { t: "Rechtstreeks van de makelaar", d: "Het aanbod komt automatisch uit het systeem van de makelaar en je reactie gaat direct naar hen." },
          { t: "Makelaars: één koppeling", d: "Via Kolibri of Realworks staan recreatiewoningen op Mooihuus en gewone woningen op Woonhuus. Eén account voor beide." },
        ].map((u) => (
          <div key={u.t} className="card">
            <div className="font-display font-bold text-bosgroen-dk">{u.t}</div>
            <p className="text-sm text-grijs mt-1">{u.d}</p>
          </div>
        ))}
      </section>

      <p className="text-sm text-grijs mt-8">
        Toch op zoek naar een plek om tot rust te komen? <Link href="/" className="text-bosgroen font-semibold hover:underline">Bekijk de recreatiewoningen op Mooihuus →</Link>
      </p>
    </div>
  );
}
