import type { Metadata } from "next";
import { MOOIHUUS_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Over Woonhuus",
  description: "Woonhuus.nl is het platform voor gewone koopwoningen, het buurhuus van Mooihuus.nl voor recreatiewoningen.",
  alternates: { canonical: "/over-woonhuus" },
};

export default function OverWoonhuus() {
  return (
    <div className="legal">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Over Woonhuus</h1>
      <p className="text-grijs mt-2">Woonhuus.nl is het platform voor gewone koopwoningen: eengezinswoningen, appartementen, starterswoningen en meer. Woningen worden aangeboden door makelaars en particulieren.</p>
      <h2>Het buurhuus van Mooihuus</h2>
      <p>Woonhuus.nl hoort bij Mooihuus.nl, het platform voor recreatiewoningen. Recreatiewoningen, chalets en vakantiehuizen staan op Mooihuus.nl; gewone woningen om permanent in te wonen staan op Woonhuus.nl. Zo staat elke woning waar de juiste kopers zoeken.</p>
      <h2>Wat Woonhuus wel en niet doet</h2>
      <ul>
        <li>Woonhuus biedt <strong>alleen de advertentie</strong> aan. Wij begeleiden de verkoop van een gewone woning niet en zijn geen makelaar.</li>
        <li>Woonhuus toont <strong>alleen koopwoningen</strong>. Gewone huurwoningen bieden we niet aan.</li>
        <li>Volledige begeleiding, van advertentie tot contract en alles eromheen met de Huusmeesters, bieden we alleen bij recreatiewoningen op Mooihuus.nl.</li>
      </ul>
      <h2>Voor woningzoekers</h2>
      <p>Zoeken, bewaren en vergelijken is gratis en zonder account. Reageer je op een woning, dan gaat je bericht rechtstreeks naar de makelaar of particulier die de woning aanbiedt.</p>
      <h2>Voor makelaars en particulieren</h2>
      <p>Makelaars sluiten één keer aan via Kolibri of Realworks: koopwoningen komen op Woonhuus.nl, recreatiewoningen op Mooihuus.nl. Particulieren plaatsen hun woning zelf. Inloggen en facturen beheren doet u via uw account op <a href={MOOIHUUS_URL}>Mooihuus.nl</a>; één account geldt voor beide platformen.</p>
      <h2>Wie zit erachter?</h2>
      <p>Woonhuus.nl en Mooihuus.nl zijn diensten van Huus B.V. De <a href="/voorwaarden">voorwaarden</a> en de <a href="/privacy">privacyverklaring</a> gelden voor beide platformen.</p>
    </div>
  );
}
