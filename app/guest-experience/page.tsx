import type { Metadata } from "next";
import Link from "next/link";
import { GuestExperienceForm } from "@/components/GuestExperienceForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guest Experience — anonieme gasttest voor parken | Mooihuus",
  description:
    "Wij sturen een anonieme gast of gezin naar jullie park, testen élke service en dienst zoals een echte gast, en leveren een helder rapport met concrete verbeterpunten. Voor parken en organisaties.",
  alternates: { canonical: "/guest-experience" },
};

const PRINCIPES = [
  { titel: "Echt anoniem", tekst: "De tester boekt en betaalt zelf, als elke andere gast. Het park weet niet wélke boeking het betreft — dus niks wordt mooier gemaakt dan het is." },
  { titel: "De hele reis", tekst: "Van de website en boeking tot check-in, de woning, de faciliteiten, het personeel en het vertrek. Elk contactmoment telt mee." },
  { titel: "Om van te leren", tekst: "Geen afrekening, maar een spiegel: wat gaat goed, waar lekt de beleving weg, en welke ingrepen leveren het meeste op." },
];

const CATEGORIEEN = [
  "Boeking & website", "Aankomst & check-in", "De accommodatie", "Faciliteiten",
  "Personeel & service", "Activiteiten & animatie", "Vertrek & nazorg", "Sfeer & prijs-kwaliteit",
];

const PAKKETTEN = [
  { naam: "Basis-audit", prijs: "vanaf € 1.500", sub: "1 nacht · alleen of als stel", feats: ["Eén anonieme overnachting", "Volledige scorecard", "Rapport met scores & top-verbeterpunten", "Actieplan op prioriteit"] },
  { naam: "Volledige Guest Experience", prijs: "€ 2.750 – 3.500", sub: "gezin · 2 nachten", feats: ["Alle faciliteiten getest", "Uitgebreid rapport met foto's & benchmark", "Actieplan op prioriteit", "Nabespreking met management"], feat: true },
  { naam: "Seizoen / partnerschap", prijs: "vanaf € 6.500", sub: "meten, verbeteren, opnieuw meten", feats: ["Meerdere bezoeken door het jaar", "Her-audit om vooruitgang te meten", "Presentatie aan management", "Prijs op maat"] },
];

export default function GuestExperiencePage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <section className="bg-bosgroen text-white rounded-2xl p-7 md:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-salie/25 text-white font-display font-semibold text-xs px-3 py-1 rounded-full">Nieuw · voor parken &amp; organisaties</span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight mt-3">Guest Experience</h1>
          <p className="text-[#DDECE0] mt-3">
            Wij sturen een anonieme gast of gezin naar jullie park, testen élke service en dienst zoals een échte gast die beleeft,
            en leveren een helder rapport met concrete verbeterpunten.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="bg-white/12 border border-white/20 text-white text-sm px-3 py-1.5 rounded-full">100% anoniem getest</span>
            <span className="bg-white/12 border border-white/20 text-white text-sm px-3 py-1.5 rounded-full">Objectieve scorecard</span>
            <span className="bg-white/12 border border-white/20 text-white text-sm px-3 py-1.5 rounded-full">Rapport met actieplan</span>
          </div>
          <a href="#aanvragen" className="btn mt-5">Vraag het aan →</a>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-salie/25" />
      </section>

      {/* Intro + principes */}
      <section className="mt-8">
        <p className="text-lg text-inkt max-w-3xl">
          Met jarenlange ervaring op tal van recreatieparken door heel Nederland én een achtergrond in de{" "}
          <strong className="text-bosgroen-dk">hotellerie</strong> weten we precies waar gastbeleving wordt gemaakt of gebroken.
          Juist die combinatie geeft ons een scherp <strong className="text-bosgroen-dk">oog voor detail</strong> — de kleine dingen
          die een gast onthoudt en die het verschil maken tussen een prima verblijf en een onvergetelijk verblijf.
        </p>
        <p className="text-lg text-inkt max-w-3xl mt-4">
          Een park staat of valt bij de <strong className="text-bosgroen-dk">gastbeleving</strong> — en juist die zie je van binnenuit
          bijna nooit scherp. Onze tester boekt als een gewone gast en niemand op het park weet wie het is. Zo meet je niet de
          bedoeling, maar de <strong className="text-bosgroen-dk">werkelijkheid</strong>: wat een gast écht meemaakt van boeking tot vertrek.
        </p>
        <div className="grid gap-3 sm:grid-cols-3 mt-6">
          {PRINCIPES.map((p) => (
            <div key={p.titel} className="card">
              <div className="w-9 h-1.5 rounded bg-oranje mb-3" />
              <div className="font-display font-bold text-bosgroen-dk">{p.titel}</div>
              <p className="text-sm text-grijs mt-1">{p.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Wat we beoordelen */}
      <section className="mt-8">
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk">Wat we beoordelen</h2>
        <p className="text-grijs mt-1 max-w-2xl">Acht categorieën, elk met concrete criteria en een score van 1 tot 5. Objectief, vergelijkbaar en herhaalbaar — ook als we later opnieuw meten.</p>
        <div className="grid gap-2.5 sm:grid-cols-2 mt-4">
          {CATEGORIEEN.map((c) => (
            <div key={c} className="card flex items-center gap-3 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-bosgroen shrink-0" />
              <span className="font-display font-semibold text-inkt">{c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Prijzen */}
      <section className="mt-8">
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk">Pakketten</h2>
        <p className="text-grijs mt-1 max-w-2xl">Je krijgt een uitkomst — betere reviews, hogere bezetting, minder klachten. Grotere parken zitten aan de bovenkant.</p>
        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          {PAKKETTEN.map((p) => (
            <div key={p.naam} className={`card relative ${p.feat ? "border-oranje ring-1 ring-oranje/40" : ""}`}>
              {p.feat && <span className="absolute -top-2.5 right-3 bg-oranje text-white font-display font-semibold text-[0.68rem] px-2.5 py-0.5 rounded-full">Aanbevolen</span>}
              <div className="font-display font-bold text-bosgroen-dk text-lg">{p.naam}</div>
              <div className="font-display font-extrabold text-xl text-oranje-dk mt-1">{p.prijs}</div>
              <div className="text-xs text-grijs">{p.sub}</div>
              <ul className="mt-3 space-y-1.5">
                {p.feats.map((f) => (
                  <li key={f} className="text-sm pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-bosgroen before:font-bold">{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-[#FBEEE4] border border-[#F0D6C1] rounded-xl p-4 mt-4 text-sm text-inkt">
          <strong className="text-oranje-dk">Let op — alle bedragen zijn exclusief boekings- en verblijfskosten.</strong> De overnachting
          boekt en betaalt de tester zelf (dat houdt het anoniem) en rekenen we als onkosten door. Zo testen we bovendien de échte,
          betaalde gastreis, inclusief het boekingsproces.
        </div>
      </section>

      {/* Aanvraag */}
      <section id="aanvragen" className="card mt-8">
        <h2 className="font-display font-bold text-xl text-bosgroen-dk">Vraag de Guest Experience aan</h2>
        <p className="text-grijs text-sm mt-1 mb-4 max-w-2xl">
          Laat je gegevens achter, dan nemen we contact op om het bezoek te bespreken en in te plannen. Vrijblijvend — je zit nergens aan vast.
        </p>
        <GuestExperienceForm />
      </section>

      <p className="text-sm text-grijs mt-6">
        Meer diensten voor je recreatiewoning of park? Bekijk de{" "}
        <Link href="/huusmeesters" className="text-bosgroen font-semibold underline">Huusmeesters</Link>.
      </p>
    </div>
  );
}
