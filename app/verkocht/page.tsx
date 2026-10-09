import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "U heeft uw woning verkocht. Wat nu?! | Mooihuus",
  description:
    "Uw recreatiewoning is verkocht. En dan? Een helder stappenplan van het informeren van het park tot de overdracht bij de notaris. En wilt u contractuele begeleiding? Dat kan zeker, via Luyten Makelaardij.",
  alternates: { canonical: "/verkocht" },
};

const STAPPEN = [
  { icon: "🏕️", titel: "1. Park of VvE informeren", tekst: "Meld de verkoop bij het recreatiepark of de vereniging. Vaak is hun toestemming nodig vóór de overdracht, samen met het overzetten van lidmaatschap en servicekosten." },
  { icon: "🛡️", titel: "2. Verzekering & nutsvoorzieningen", tekst: "Zeg uw opstal- en inboedelverzekering en de abonnementen voor water en energie op, of zet ze over naar de koper." },
  { icon: "🔑", titel: "3. Sleutel- en inventarisoverdracht", tekst: "Spreek de opleverdatum en eventuele inboedel en inventaris af met de koper." },
  { icon: "⚖️", titel: "4. Naar de notaris", tekst: "De eigendomsoverdracht en de akte regelt u bij de notaris. Een eventuele financiering wordt op dat moment afgelost. Wij werken samen met ervaren notariskantoren." },
  { icon: "💶", titel: "5. Financiën & belasting", tekst: "Rond de financiële kant af en denk aan de fiscale gevolgen, bijvoorbeeld box 3." },
];

export default function VerkochtPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <span className="inline-block bg-oranje text-white font-display font-semibold text-xs px-3 py-1 rounded-full">Verkocht 🎉</span>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk mt-2">U heeft uw woning verkocht. Wat nu?!</h1>
      <p className="text-grijs mt-2 max-w-2xl">
        Gefeliciteerd! Na de verkoop komt er nog een aantal dingen kijken. Met dit stappenplan rondt u het netjes en
        zonder zorgen af, en waar nodig helpen wij u graag verder.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mt-6">
        {STAPPEN.map((s) => (
          <div key={s.titel} className="card flex gap-3 items-start">
            <div className="text-2xl shrink-0">{s.icon}</div>
            <div>
              <div className="font-display font-bold text-bosgroen-dk">{s.titel}</div>
              <div className="text-sm text-grijs mt-0.5">{s.tekst}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Hulp bij een van deze stappen (geen stap, maar een aanbod) */}
      <div className="mt-4 rounded-2xl bg-creme border border-salie p-4 flex gap-3 items-center flex-wrap">
        <div className="text-2xl">🤝</div>
        <div className="flex-1 min-w-[220px] text-sm text-grijs">
          Hulp nodig bij een van deze stappen? De Huusmeesters en onze makelaar denken vrijblijvend met u mee.
        </div>
        <Link href="/huusmeesters" className="btn btn-green text-sm">Naar de Huusmeesters</Link>
      </div>

      {/* Contractuele begeleiding */}
      <div className="mt-8 rounded-2xl bg-bosgroen text-white p-6 md:p-8">
        <h2 className="font-display font-extrabold text-2xl">Wilt u contractuele begeleiding?</h2>
        <p className="text-salie-lt mt-2 max-w-2xl">
          Dat kan zeker! Bij de verkoop, de contracten en de juridische afwikkeling hoeft u het niet alleen te doen.
          Via <strong className="text-white">Luyten Makelaardij</strong> krijgt u professionele, contractuele begeleiding
          bij alles van het opstellen en controleren van de koopovereenkomst tot een soepele overdracht. Zelf de regie, maar nooit alleen.
        </p>
        <div className="mt-5">
          <Link
            href="/contact?onderwerp=Contractuele begeleiding via Luyten Makelaardij"
            className="btn bg-white text-bosgroen-dk hover:bg-zand"
          >
            Vraag hier hulp aan
          </Link>
        </div>
      </div>

      <div className="mt-8 flex gap-3 flex-wrap">
        <Link href="/huusmeesters" className="btn btn-green text-sm">Bekijk de Huusmeesters</Link>
        <Link href="/plaatsen" className="btn btn-ghost text-sm">Nieuwe woning plaatsen</Link>
      </div>
    </div>
  );
}
