import { LegalShell } from "@/components/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Cookiebeleid — Mooihuus" };

export default function Cookies() {
  return (
    <LegalShell title="Cookiebeleid">
      <p>
        Mooihuus.nl ({COMPANY.bv}) gebruikt cookies en vergelijkbare technieken. Hieronder leggen we
        uit welke en waarvoor.
      </p>

      <h2>1. Wat zijn cookies</h2>
      <p>
        Cookies zijn kleine bestandjes die bij een bezoek op je apparaat worden opgeslagen. Ze
        zorgen er bijvoorbeeld voor dat je ingelogd blijft.
      </p>

      <h2>2. Welke cookies gebruiken wij</h2>
      <ul>
        <li>
          <strong>Noodzakelijke cookies</strong> — nodig voor het functioneren van de site, zoals je
          inlogsessie en beveiliging. Deze plaatsen we altijd; hiervoor is geen toestemming vereist.
        </li>
        <li>
          <strong>Voorkeurscookies</strong> — onthouden bijvoorbeeld je cookiekeuze.
        </li>
        <li>
          <strong>Analytische cookies</strong> — als we die inzetten, gebruiken we ze om de site te
          verbeteren. Deze plaatsen we alleen met jouw toestemming.
        </li>
      </ul>
      <p>
        We plaatsen <strong>geen</strong> tracking- of advertentiecookies zonder je toestemming.
      </p>

      <h2>3. Je toestemming beheren</h2>
      <p>
        Bij je eerste bezoek vragen we je keuze via de cookiemelding. Je kunt je keuze altijd
        aanpassen door de cookies in je browser te verwijderen; bij een volgend bezoek vragen we het
        opnieuw. Noodzakelijke cookies kunnen niet worden uitgezet, omdat de site anders niet werkt.
      </p>

      <h2>4. Vragen</h2>
      <p>Vragen over cookies? Mail {COMPANY.privacyEmail}.</p>
    </LegalShell>
  );
}
