import { LegalShell } from "@/components/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Algemene voorwaarden — Mooihuus" };

export default function Voorwaarden() {
  return (
    <LegalShell title="Algemene voorwaarden">
      <h2>1. Wie zijn wij</h2>
      <p>
        Mooihuus.nl is een dienst van <strong>{COMPANY.bv}</strong> (hierna: “Mooihuus”, “wij”),
        gevestigd te {COMPANY.adres}, {COMPANY.postcode}, ingeschreven bij de Kamer van Koophandel
        onder nummer {COMPANY.kvk}. Contact: {COMPANY.email}.
      </p>

      <h2>2. Wat Mooihuus is (en niet is)</h2>
      <p>
        Mooihuus is een online <strong>advertentieplatform</strong> waarop particulieren en
        makelaars hun recreatiewoning te koop of te huur kunnen aanbieden. Mooihuus is
        <strong> geen makelaar, geen bemiddelaar en geen partij</strong> bij een koop-, huur- of
        andere overeenkomst die tussen gebruikers tot stand komt. Wij zijn evenmin een
        boekingsplatform; verhuur wordt uitgevoerd via onze partner (Belvilla), die daarvoor een
        eigen overeenkomst en voorwaarden hanteert.
      </p>

      <h2>3. Account</h2>
      <ul>
        <li>Je bent verantwoordelijk voor de juistheid van je gegevens en de geheimhouding van je inloggegevens.</li>
        <li>Je moet 18 jaar of ouder zijn en handelingsbevoegd om een account te gebruiken.</li>
        <li>Wij mogen een account weigeren, opschorten of beëindigen bij misbruik of strijd met deze voorwaarden.</li>
      </ul>

      <h2>4. Advertenties plaatsen</h2>
      <ul>
        <li>Je staat ervoor in dat je gerechtigd bent de woning aan te bieden en dat je advertentie juist en volledig is.</li>
        <li>Geen misleidende, onrechtmatige of inbreukmakende inhoud; je hebt de rechten op geplaatste foto’s en teksten.</li>
        <li>Je verleent Mooihuus een niet-exclusieve licentie om de advertentie-inhoud te tonen en te promoten binnen de dienst.</li>
        <li>Wij mogen advertenties modereren, weigeren of verwijderen (bijvoorbeeld bij vermoeden van fraude).</li>
      </ul>

      <h2>5. Prijzen en betaling</h2>
      <ul>
        <li>Adverteren gebeurt tegen een <strong>eenmalig</strong> bedrag per advertentie (pakketten Basis, Plus, Premium), plus eventuele losse opties. Actuele prijzen staan in de dienst.</li>
        <li>Betaling verloopt via onze betaaldienstverlener (o.a. iDEAL via Mollie). De advertentie wordt geactiveerd na ontvangst van de betaling.</li>
        <li>Je ontvangt een betalingsbewijs per e-mail. Genoemde bedragen zijn inclusief btw, tenzij anders vermeld.</li>
        <li>Omdat de dienst direct na betaling wordt geleverd, kan het herroepingsrecht zijn uitgesloten voor zover je daarmee bij aankoop hebt ingestemd.</li>
      </ul>

      <h2>6. Verhuur via Belvilla</h2>
      <p>
        Kies je ervoor je woning te verhuren, dan kunnen wij je (met jouw toestemming) doorverwijzen
        naar onze partner Belvilla. De verhuur, boekingen en gastbetalingen vallen dan onder de
        overeenkomst en voorwaarden van Belvilla. Mooihuus is daarbij geen partij.
      </p>

      <h2>7. Aansprakelijkheid</h2>
      <ul>
        <li>Mooihuus levert de dienst “as is” en garandeert niet dat het platform ononderbroken of foutloos beschikbaar is.</li>
        <li>Wij zijn niet aansprakelijk voor de inhoud van advertenties of voor afspraken tussen gebruikers onderling.</li>
        <li>Voor zover wij aansprakelijk zijn, is die aansprakelijkheid beperkt tot het door jou betaalde bedrag voor de betreffende advertentie, behoudens opzet of bewuste roekeloosheid.</li>
      </ul>

      <h2>8. Intellectueel eigendom</h2>
      <p>
        De naam Mooihuus, het logo en de vormgeving van het platform zijn eigendom van {COMPANY.bv}.
        Zonder toestemming mag je deze niet gebruiken.
      </p>

      <h2>9. Wijzigingen</h2>
      <p>Wij mogen deze voorwaarden en de dienst wijzigen. De actuele versie staat altijd op de website.</p>

      <h2>10. Toepasselijk recht</h2>
      <p>
        Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de
        bevoegde rechter in het arrondissement waar {COMPANY.bv} is gevestigd.
      </p>
    </LegalShell>
  );
}
