import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "U heeft uw woning verkocht. Wat nu?! | Mooihuus",
  description:
    "Uw recreatiewoning is verkocht — en dan? Een helder stappenplan van notaris tot sleuteloverdracht. En wilt u contractuele begeleiding? Dat kan zeker, via Luyten Makelaardij.",
  alternates: { canonical: "/verkocht" },
};

const STAPPEN = [
  { icon: "⚖️", titel: "1. Naar de notaris", tekst: "De eigendomsoverdracht en de akte regelt u bij de notaris. Wij werken samen met ervaren notariskantoren." },
  { icon: "🔑", titel: "2. Sleutel- en inventarisoverdracht", tekst: "Spreek de opleverdatum en eventuele inboedel/inventaris af met de koper." },
  { icon: "🛡️", titel: "3. Verzekering & nutsvoorzieningen", tekst: "Zeg uw opstal- en inboedelverzekering en de abonnementen (water, energie) op of zet ze over." },
  { icon: "🏕️", titel: "4. Park of VvE informeren", tekst: "Meld de verkoop bij het recreatiepark of de vereniging en regel de overdracht van lidmaatschap en servicekosten." },
  { icon: "💶", titel: "5. Financiën & belasting", tekst: "Los een eventuele financiering af en denk aan de fiscale kant (o.a. box 3)." },
  { icon: "🤝", titel: "6. Hulp nodig?", tekst: "Twijfelt u ergens over? De Huusmeesters en onze makelaar denken vrijblijvend met u mee." },
];

export default function VerkochtPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <span className="inline-block bg-oranje text-white font-display font-semibold text-xs px-3 py-1 rounded-full">Verkocht 🎉</span>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk mt-2">U heeft uw woning verkocht. Wat nu?!</h1>
      <p className="text-grijs mt-2 max-w-2xl">
        Gefeliciteerd! Na de verkoop komt er nog een aantal dingen kijken. Met dit stappenplan rondt u het netjes en
        zonder zorgen af — en waar nodig helpen wij u graag verder.
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

      {/* Contractuele begeleiding */}
      <div className="mt-8 rounded-2xl bg-bosgroen text-white p-6 md:p-8">
        <h2 className="font-display font-extrabold text-2xl">Wilt u contractuele begeleiding?</h2>
        <p className="text-salie-lt mt-2 max-w-2xl">
          Dat kan zeker! Bij de verkoop, de contracten en de juridische afwikkeling hoeft u het niet alleen te doen.
          Via <strong className="text-white">Luyten Makelaardij</strong> krijgt u professionele, contractuele begeleiding —
          van het opstellen en controleren van de koopovereenkomst tot een soepele overdracht. Zelf de regie, nooit alleen.
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
