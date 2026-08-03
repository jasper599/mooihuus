import type { Metadata } from "next";
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

      {/* Vaste partners */}
      <h2 className="font-display font-bold text-xl text-bosgroen-dk mt-8 mb-2">Onze partners</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {HUUSMEESTERS_PARTNERS.map((p) => (
          <a
            key={p.url}
            href={p.url}
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
        {HUUSMEESTERS_CATEGORIEEN.map((c) => (
          <div key={c.titel} className="card flex gap-3 items-start">
            <div className="w-11 h-11 rounded-xl bg-salie-lt flex items-center justify-center text-xl shrink-0">{c.icon}</div>
            <div>
              <div className="font-display font-bold text-bosgroen-dk">{c.titel}</div>
              <div className="text-sm text-grijs">{c.tekst}</div>
            </div>
          </div>
        ))}
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
