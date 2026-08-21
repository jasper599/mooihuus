import type { Metadata } from "next";
import Link from "next/link";
import { FotografieForm } from "@/components/FotografieForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fotografie, plattegrond & video voor je recreatiewoning — € 450 | Mooihuus",
  description:
    "Professionele fotoreportage, een heldere plattegrond én een YouTube-rondleiding van je recreatiewoning. Compleet pakket voor € 450. Vraag het vrijblijvend aan.",
  alternates: { canonical: "/fotografie" },
};

const INBEGREPEN = [
  { icon: "📸", titel: "Professionele fotoreportage", tekst: "Een fotograaf legt je woning van binnen en buiten sfeervol vast, met oog voor licht en detail. Je ontvangt de bewerkte foto's in hoge resolutie." },
  { icon: "📐", titel: "Plattegrond", tekst: "Een duidelijke, nette plattegrond zodat kijkers meteen de indeling en verhoudingen zien — scheelt veel vragen en trekt serieuzere kopers." },
  { icon: "🎬", titel: "YouTube-rondleiding", tekst: "Een korte videorondleiding die je direct op je woningpagina kunt tonen en overal kunt delen. Video verkoopt: kijkers krijgen echt een gevoel bij de woning." },
];

const STAPPEN = [
  { n: "1", titel: "Je vraagt aan", tekst: "Vul het formulier in met je gegevens en het adres van de woning. Vrijblijvend — je zit nergens aan vast." },
  { n: "2", titel: "We plannen de shoot", tekst: "We nemen contact met je op om een datum en tijd te prikken die jou uitkomt." },
  { n: "3", titel: "Je ontvangt alles", tekst: "Na de shoot lever je de foto's, plattegrond en video aan — klaar om je woning te laten stralen. De factuur van € 450 volgt daarna." },
];

export default function FotografiePage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <section className="bg-bosgroen text-white rounded-2xl p-7 md:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-salie/25 text-white font-display font-semibold text-xs px-3 py-1 rounded-full">Nieuw · Mediapakket</span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight mt-3">
            Foto's, plattegrond én video — voor één vaste prijs
          </h1>
          <p className="text-[#DDECE0] mt-3">
            Een woning met goede foto's, een heldere plattegrond en een korte video valt meteen op en verkoopt sneller.
            Wij regelen het complete plaatje voor je.
          </p>
          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <span className="font-display font-extrabold text-3xl">€ 450</span>
            <span className="text-salie-lt text-sm">compleet pakket · vrijblijvend aanvragen</span>
          </div>
          <a href="#aanvragen" className="btn mt-5">Vraag het aan →</a>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-salie/25" />
      </section>

      {/* Wat je krijgt */}
      <section className="mt-8">
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk">Wat zit erin?</h2>
        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          {INBEGREPEN.map((i) => (
            <div key={i.titel} className="card">
              <div className="w-11 h-11 rounded-xl bg-salie-lt flex items-center justify-center text-xl">{i.icon}</div>
              <div className="font-display font-bold text-bosgroen-dk mt-3">{i.titel}</div>
              <p className="text-sm text-grijs mt-1">{i.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hoe het werkt */}
      <section className="mt-8">
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk">Zo werkt het</h2>
        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          {STAPPEN.map((s) => (
            <div key={s.n} className="card flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full bg-bosgroen text-white font-display font-extrabold flex items-center justify-center shrink-0">{s.n}</div>
              <div>
                <div className="font-display font-bold text-bosgroen-dk">{s.titel}</div>
                <div className="text-sm text-grijs mt-0.5">{s.tekst}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aanvraagformulier */}
      <section id="aanvragen" className="card mt-8">
        <h2 className="font-display font-bold text-xl text-bosgroen-dk">Vraag het fotografiepakket aan</h2>
        <p className="text-grijs text-sm mt-1 mb-4 max-w-2xl">
          Laat je gegevens en het adres van de woning achter. We nemen contact met je op om de fotoshoot in te
          plannen. Je betaalt pas na afspraak — de aanvraag is vrijblijvend.
        </p>
        <FotografieForm />
      </section>

      <p className="text-sm text-grijs mt-6">
        Liever eerst je woning plaatsen? Dat kan los —{" "}
        <Link href="/plaatsen" className="text-bosgroen font-semibold underline">plaats je huus</Link>{" "}
        en boek de fotografie er gerust bij.
      </p>
    </div>
  );
}
