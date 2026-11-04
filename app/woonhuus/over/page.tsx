import type { Metadata } from "next";
import { MOOIHUUS_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Over Woonhuus",
  description: "Woonhuus.nl is het platform voor gewone koop- en huurwoningen, naast Mooihuus.nl voor recreatiewoningen.",
  alternates: { canonical: "/over-woonhuus" },
};

export default function OverWoonhuus() {
  return (
    <div className="legal">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Over Woonhuus</h1>
      <p className="text-grijs mt-2">Woonhuus.nl is het platform voor gewone koop- en huurwoningen: eengezinswoningen, appartementen, starterswoningen en meer. Het aanbod komt rechtstreeks van makelaars.</p>
      <h2>Eén platform, twee etalages</h2>
      <p>Woonhuus.nl hoort bij Mooihuus.nl, het platform voor recreatiewoningen. Makelaars sluiten één keer aan, via Kolibri of Realworks. Hun recreatiewoningen verschijnen op Mooihuus.nl, hun gewone woningen op Woonhuus.nl. Zo staat elke woning waar de juiste kopers en huurders zoeken.</p>
      <h2>Voor woningzoekers</h2>
      <p>Zoeken, bewaren en vergelijken is gratis en zonder account. Reageer je op een woning, dan gaat je bericht rechtstreeks naar de makelaar.</p>
      <h2>Voor makelaars</h2>
      <p>Aansluiten, inloggen en uw facturen beheren doet u via uw account op <a href={MOOIHUUS_URL}>Mooihuus.nl</a>. Eén account geldt voor beide platformen.</p>
      <h2>Wie zit erachter?</h2>
      <p>Woonhuus.nl en Mooihuus.nl zijn diensten van Huus B.V. De <a href="/voorwaarden">voorwaarden</a> en de <a href="/privacy">privacyverklaring</a> gelden voor beide platformen.</p>
    </div>
  );
}
