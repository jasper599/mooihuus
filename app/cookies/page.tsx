import { LegalShell } from "@/components/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Cookiebeleid" };

export default function Cookies() {
  return (
    <LegalShell title="Cookiebeleid">
      <p>
        Mooihuus.nl en Woonhuus.nl ({COMPANY.bv}) gebruiken cookies en vergelijkbare technieken, zoals
        opslag in je browser (localStorage). Hieronder lees je welke en waarvoor. Je keuze geldt per
        website: op Mooihuus.nl en op Woonhuus.nl vragen we je toestemming apart.
      </p>

      <h2>1. Wat zijn cookies</h2>
      <p>
        Cookies zijn kleine bestandjes die bij een bezoek op je apparaat worden opgeslagen. Vergelijkbare
        technieken, zoals opslag in je browser, werken op dezelfde manier. Ze zorgen er bijvoorbeeld voor
        dat je ingelogd blijft of dat je bewaarde woningen onthouden worden.
      </p>

      <h2>2. Welke cookies en opslag gebruiken wij</h2>
      <h3>Noodzakelijk (altijd)</h3>
      <ul>
        <li><strong>Inlogsessie en beveiliging</strong>: houdt je ingelogd en beschermt formulieren tegen misbruik.</li>
        <li><strong>Je cookiekeuze</strong>: onthoudt of je hebt gekozen voor “Accepteren” of “Alleen noodzakelijk”.</li>
        <li><strong>Favorieten</strong>: de woningen die je bewaart, opgeslagen in je eigen browser.</li>
        <li><strong>Taalkeuze</strong>: onthoudt in welke taal je de website wilt zien.</li>
      </ul>
      <h3>Eigen bezoekstatistiek (zonder cookies van derden)</h3>
      <p>
        Om te tellen hoe vaak pagina’s en woningen worden bekeken, slaan we in je browser een willekeurige,
        anonieme bezoekerscode op. Daarmee tellen we alleen bezoeken op onze eigen server; we delen deze
        gegevens met niemand en gebruiken ze niet om je te volgen op andere websites. Makelaars en aanbieders
        zien alleen totalen, zoals het aantal weergaven van hun woning.
      </p>
      <h3>Marketing (alleen met toestemming)</h3>
      <p>
        Klik je op “Accepteren”, dan laden we de Google-tag (Google Ads). Google kan dan cookies plaatsen om
        te meten of onze advertenties werken en om advertenties te tonen. Kies je “Alleen noodzakelijk”, dan
        laden we de Google-tag niet en wordt er niets naar Google gestuurd. Op het gebruik door Google is
        het privacybeleid van Google van toepassing.
      </p>

      <h2>3. Je toestemming beheren</h2>
      <p>
        Bij je eerste bezoek vragen we je keuze via de cookiemelding. Wil je je keuze wijzigen, verwijder
        dan de cookies en websitegegevens van deze website in je browser; bij een volgend bezoek vragen we
        het opnieuw. Noodzakelijke cookies kunnen niet worden uitgezet, omdat de website anders niet werkt.
      </p>

      <h2>4. Vragen</h2>
      <p>Vragen over cookies? Mail {COMPANY.privacyEmail}. Zie ook onze <a href="/privacy">privacyverklaring</a>.</p>
    </LegalShell>
  );
}
