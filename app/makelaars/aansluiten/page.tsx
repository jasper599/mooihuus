import type { Metadata } from "next";
import { kolibriTariefNu, makelaarBasisTarief, kolibriLanceringActief, realworksGratisAantal } from "@/lib/facturatie";
import { COMPANY } from "@/lib/company";
import { AansluitForm } from "./AansluitForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aansluiten voor makelaars | Mooihuus en Woonhuus",
  description: "Zet uw aanbod met één koppeling op Mooihuus.nl en Woonhuus.nl. Via Kolibri of Realworks, zonder abonnement.",
};

// Aansluitpagina voor makelaars: per makelaarspakket de stappen om het aanbod
// automatisch op Mooihuus (recreatie) en Woonhuus (koop) te zetten.
export default function Aansluiten() {
  const tarief = kolibriTariefNu();
  const basis = makelaarBasisTarief();
  const actie = kolibriLanceringActief();
  const gratis = realworksGratisAantal();

  return (
    <div className="max-w-5xl mx-auto">
      <section className="bg-bosgroen-dk text-white rounded-2xl p-7 md:p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl flex flex-col gap-4">
          <div className="font-display font-semibold text-salie-lt text-sm">Voor makelaars</div>
          <h1 className="m-0 font-display font-extrabold text-4xl md:text-5xl leading-[1.08]">Eén keer koppelen. Daarna gaat alles vanzelf.</h1>
          <p className="m-0 text-salie-lt text-lg">
            Uw recreatiewoningen op Mooihuus.nl, uw koopwoningen op Woonhuus.nl. Rechtstreeks vanuit uw eigen systeem, zonder abonnement.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="rounded-full bg-white/10 px-4 py-2 font-display font-bold">€ {tarief} per woning per jaar{actie ? `, daarna € ${basis}` : ""}</span>
            {gratis > 0 && <span className="rounded-full bg-oranje px-4 py-2 font-display font-bold">Realworks: eerste {gratis} woningen gratis</span>}
          </div>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-salie/20" />
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Geen abonnement", d: "U betaalt per woning per jaar. Geen maandbedrag, geen courtage." },
          { t: "Twee platforms, één koppeling", d: "Recreatie gaat naar Mooihuus, gewone koopwoningen naar Woonhuus. Dat regelen wij." },
          { t: "Aanvragen direct naar u", d: "Elke reactie van een geïnteresseerde komt rechtstreeks in uw mailbox." },
        ].map((u) => (
          <div key={u.t} className="card">
            <div className="font-display font-bold text-bosgroen-dk">{u.t}</div>
            <div className="text-sm text-grijs mt-1">{u.d}</div>
          </div>
        ))}
      </section>

      <h2 className="mt-12 mb-4 font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">Met welk systeem werkt u?</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <section id="kolibri" className="card">
          <div className="flex items-center gap-2">
            <h3 className="m-0 font-display font-bold text-xl text-bosgroen-dk">Kolibri</h3>
            <span className="pill">Direct beschikbaar</span>
          </div>
          <ol className="mt-4 mb-0 list-decimal pl-5 space-y-2 text-sm">
            <li>Open Kolibri en ga naar uw mediapartners.</li>
            <li>Zet het <strong>Mooihuus-kanaal</strong> aan voor de woningen die u wilt plaatsen.</li>
            <li>Binnen een half uur ontvangt u per mail uw inloggegevens en de factuur met betaallink.</li>
            <li>Na betaling staan de woningen direct online. Klaar.</li>
          </ol>
        </section>

        <section id="realworks" className="card border-oranje">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="m-0 font-display font-bold text-xl text-bosgroen-dk">Realworks</h3>
            {gratis > 0 && <span className="pill bg-oranje text-white">Eerste {gratis} woningen gratis</span>}
          </div>
          <ol className="mt-4 mb-0 list-decimal pl-5 space-y-2 text-sm">
            <li>Activeer in Realworks de <strong>Wonen API</strong> voor uw vestiging. Realworks rekent hiervoor eenmalig € 140 en € 10 per maand per vestiging.</li>
            <li>Kopieer de API-sleutel die Realworks voor u aanmaakt.</li>
            <li>Plak de sleutel in het formulier hieronder.</li>
            <li>Uw eerste {gratis} woningen zetten wij gratis een jaar online. Daarna geldt het gewone tarief.</li>
          </ol>
          {gratis > 0 && <p className="text-xs text-grijs mt-3 mb-0">Met {gratis} gratis plaatsingen verdient u de aansluitkosten van Realworks direct terug.</p>}
        </section>
      </div>

      <section id="aanmelden" className="mt-8 rounded-2xl border border-lijn bg-white p-6 md:p-8">
        <h2 className="m-0 font-display font-extrabold text-2xl text-bosgroen-dk">Realworks-kantoor aansluiten</h2>
        <p className="text-sm text-grijs mt-2 mb-5">Heeft u de API-sleutel? Vul hieronder uw gegevens in. We controleren de koppeling meteen.</p>
        <AansluitForm />
      </section>

      <section className="mt-8 card bg-zand/40">
        <h3 className="m-0 font-display font-bold text-lg text-bosgroen-dk">Werkt u met een ander pakket?</h3>
        <p className="text-sm mt-2 mb-0">
          We breiden de koppelingen uit. Mail naar <a className="font-semibold text-bosgroen underline" href={`mailto:${COMPANY.email}?subject=Aansluiten%20ander%20pakket`}>{COMPANY.email}</a> met de naam van uw pakket, dan laten we u weten wanneer u kunt aansluiten.
        </p>
      </section>

      <section className="mt-10 mb-4">
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk">Veelgestelde vragen</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { v: "Welke woningen komen waar?", a: "Recreatiewoningen, chalets en vakantiehuizen verschijnen op Mooihuus.nl. Gewone koopwoningen op Woonhuus.nl. Huurwoningen nemen we niet op." },
            { v: "Hoe lang staat een woning online?", a: "Een jaar. Is de woning dan nog niet verkocht, dan krijgt u vooraf bericht om te verlengen. Verkocht? Dan gaat hij vanzelf offline." },
            { v: "Wat gebeurt er met aanvragen?", a: "Die gaan rechtstreeks naar het e-mailadres van uw kantoor. Wij zitten er niet tussen." },
            { v: "Kan ik stoppen?", a: "Altijd. Zet het kanaal in Kolibri uit of trek de sleutel in Realworks in. Er is geen opzegtermijn." },
          ].map((q) => (
            <div key={q.v} className="card">
              <div className="font-display font-bold text-bosgroen-dk">{q.v}</div>
              <div className="text-sm text-grijs mt-1">{q.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
