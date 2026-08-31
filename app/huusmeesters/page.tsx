import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { HuusmeesterForm } from "./HuusmeesterForm";
import { HUUSMEESTERS_PARTNERS, HUUSMEESTERS_CATEGORIEEN } from "@/lib/partners";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Huusmeesters — hulp & diensten voor je recreatiewoning | Mooihuus",
  description:
    "Alles rond je recreatiewoning op één plek: verzekering, hypotheek, schoonmaak, tuin, onderhoud, interieur, bergingen en wellness. Vertel ons waar je mee zit, wij helpen je verder.",
  alternates: { canonical: "/huusmeesters" },
};

export default function HuusmeestersPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <span className="inline-block bg-salie-lt text-bosgroen-dk font-display font-semibold text-xs px-3 py-1 rounded-full">
        Nieuw
      </span>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk mt-2">
        Huusmeesters
      </h1>
      <p className="text-grijs mt-2 max-w-2xl">
        Je tweede huus op afstand? De Huusmeesters zijn er voor alles eromheen — van verzekering en
        financiering tot schoonmaak, tuin, onderhoud, interieur, bergingen en wellness. We werken
        samen met betrouwbare partners en vakmensen. Vertel ons waar je mee zit, dan brengen we je in
        contact met de juiste persoon.
      </p>

      {/* Teaser: U heeft uw woning verkocht. Wat nu?! */}
      <Link href="/verkocht" className="mt-8 rounded-2xl bg-creme border border-salie p-5 flex gap-4 items-center flex-wrap hover:shadow-md transition-shadow">
        <div className="text-3xl">🎉</div>
        <div className="flex-1 min-w-[220px]">
          <div className="font-display font-bold text-bosgroen-dk">U heeft uw woning verkocht. Wat nu?!</div>
          <div className="text-sm text-grijs">Een helder stappenplan van notaris tot sleuteloverdracht — en contractuele begeleiding via Luyten als u dat wilt.</div>
        </div>
        <span className="btn btn-green text-sm">Bekijk het stappenplan →</span>
      </Link>

      {/* Teaser: fotografiepakket */}
      <Link href="/fotografie" className="mt-4 rounded-2xl bg-bosgroen text-white p-5 flex gap-4 items-center flex-wrap hover:shadow-md transition-shadow">
        <div className="text-3xl">📸</div>
        <div className="flex-1 min-w-[220px]">
          <div className="font-display font-bold">Foto's, plattegrond én video — € 450</div>
          <div className="text-sm text-salie-lt">Laat je recreatiewoning professioneel vastleggen: fotoshoot, plattegrond en een YouTube-rondleiding. Compleet pakket, vrijblijvend aan te vragen.</div>
        </div>
        <span className="btn text-sm">Bekijk het pakket →</span>
      </Link>

      {/* Teaser: Guest Experience (voor parken) */}
      <Link href="/guest-experience" className="mt-3 rounded-2xl bg-creme border border-salie p-5 flex gap-4 items-center flex-wrap hover:shadow-md transition-shadow">
        <div className="flex-1 min-w-[220px]">
          <div className="text-xs font-semibold text-oranje-dk uppercase tracking-wide">Voor parken &amp; organisaties</div>
          <div className="font-display font-bold text-bosgroen-dk mt-0.5">Guest Experience — anonieme gasttest</div>
          <div className="text-sm text-grijs">Een anonieme gast test jullie complete beleving en levert een rapport met concrete verbeterpunten. Excl. boekings- en verblijfskosten.</div>
        </div>
        <span className="btn btn-green text-sm">Bekijk de dienst →</span>
      </Link>

      {/* Vaste partners */}
      <h2 className="font-display font-bold text-xl text-bosgroen-dk mt-8 mb-2">Onze partners</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {HUUSMEESTERS_PARTNERS.map((p) => (
          <a
            key={p.url}
            href={`/api/uit?partner=${encodeURIComponent(p.naam)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex gap-3 items-start hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-salie-lt flex items-center justify-center text-xl shrink-0">{p.emoji}</div>
            <div className="flex-1">
              <div className="font-display font-bold text-bosgroen-dk">{p.naam}</div>
              <div className="text-xs font-semibold text-oranje-dk uppercase tracking-wide">{p.vak}</div>
              <p className="text-sm text-grijs mt-1">{p.omschrijving}</p>
              <span className="text-sm text-bosgroen font-semibold">Bekijk partner →</span>
            </div>
          </a>
        ))}
      </div>

      {/* Categorieën / diensten */}
      <h2 className="font-display font-bold text-xl text-bosgroen-dk mt-8 mb-2">Waar we mee helpen</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {HUUSMEESTERS_CATEGORIEEN.map((c) => {
          const inhoud = (
            <>
              <div className="w-11 h-11 rounded-xl bg-salie-lt flex items-center justify-center text-xl shrink-0">{c.icon}</div>
              <div>
                <div className="font-display font-bold text-bosgroen-dk">{c.titel}</div>
                <div className="text-sm text-grijs">{c.tekst}</div>
                {c.href && <span className="text-sm text-bosgroen font-semibold">Doe de check →</span>}
              </div>
            </>
          );
          return c.href ? (
            <Link key={c.titel} href={c.href} className="card flex gap-3 items-start hover:shadow-md transition-shadow">{inhoud}</Link>
          ) : (
            <div key={c.titel} className="card flex gap-3 items-start">{inhoud}</div>
          );
        })}
      </div>

      {/* Hulpvraag van eigenaren */}
      <div className="card mt-8">
        <h2 className="font-display font-bold text-xl text-bosgroen-dk">Waar kunnen we je mee helpen?</h2>
        <p className="text-grijs text-sm mt-1 mb-4 max-w-2xl">
          Laat weten waar je hulp of een product voor nodig hebt en in welke regio je woning staat. We
          zoeken de juiste Huusmeester of partner erbij en nemen contact met je op — vrijblijvend.
        </p>
        <ContactForm hulp defaultOnderwerp="Hulpvraag Huusmeesters" knop="Vraag hulp aan" />
      </div>

      {/* Banner: word Huusmeester */}
      <div className="mt-8 rounded-2xl overflow-hidden bg-bosgroen text-white p-6 md:p-8">
        <h2 className="font-display font-extrabold text-2xl">Hier als Huusmeester staan?</h2>
        <p className="text-salie-lt mt-2 max-w-2xl">
          Ben je hovenier, schoonmaker, klusbedrijf, interieurspecialist, of lever je bijvoorbeeld
          bergingen of wellness — voor jouw regio of landelijk? Meld je bedrijf gratis aan. We nemen
          contact op om je in ons Huusmeesters-netwerk op te nemen.
        </p>
        <div className="bg-white text-inkt rounded-xl p-4 mt-5">
          <HuusmeesterForm />
        </div>
      </div>
    </div>
  );
}
