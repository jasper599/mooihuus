import Link from "next/link";
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
        onder nummer {COMPANY.kvk}. Contact: {COMPANY.email}. Deze voorwaarden zijn van toepassing op
        het gebruik van het platform en op alle diensten die Mooihuus aanbiedt.
      </p>

      <h2>2. Wat Mooihuus is (en niet is)</h2>
      <p>
        Mooihuus is een online <strong>advertentie- en informatieplatform</strong> rondom de
        recreatiewoning. Particulieren en makelaars kunnen er hun recreatiewoning te koop of te huur
        aanbieden. Daarnaast brengt Mooihuus gebruikers in contact met partners en vakmensen voor
        diensten rondom de recreatiewoning (de “Huusmeesters”) en toont het platform huuraanbod van
        externe verhuurpartners.
      </p>
      <p>
        Mooihuus is <strong>geen makelaar, geen bemiddelaar, geen verhuurorganisatie en geen
        partij</strong> bij een koop-, huur-, dienstverlenings- of andere overeenkomst die tussen
        gebruikers onderling of tussen een gebruiker en een partner tot stand komt. Wij zijn evenmin
        een boekingsplatform. Overeenkomsten, boekingen, betalingen en de uitvoering daarvan zijn de
        verantwoordelijkheid van de betrokken partijen zelf.
      </p>

      <h2>3. Account</h2>
      <ul>
        <li>Je bent verantwoordelijk voor de juistheid van je gegevens en de geheimhouding van je inloggegevens.</li>
        <li>Je moet 18 jaar of ouder zijn en handelingsbevoegd om een account te gebruiken.</li>
        <li>Een account is persoonlijk en niet zonder onze toestemming overdraagbaar.</li>
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

      <h2>6. Verhuur en doorverwijzing naar partners</h2>
      <p>
        Een deel van het huuraanbod op Mooihuus wordt aangeboden door externe verhuurpartners (zoals
        vakantieparken en verhuurorganisaties). Boek je via zo’n woning, dan kom je rechtstreeks bij
        de betreffende partner terecht; de verhuur, boekingen en gastbetalingen vallen onder de
        overeenkomst en voorwaarden van die partner. Kies je er zelf voor je woning te verhuren of
        een dienst af te nemen, dan kunnen wij je (met jouw toestemming) doorverwijzen naar een
        geschikte partner of vakman. Mooihuus is bij die overeenkomsten geen partij.
      </p>
      <p>
        Voor sommige doorverwijzingen of boekingen kan Mooihuus een vergoeding van de partner
        ontvangen. Dit kost jou niets extra en heeft geen invloed op de prijs die je bij de partner
        betaalt.
      </p>

      <h2>7. Gebruik van het platform</h2>
      <ul>
        <li>Je gebruikt Mooihuus alleen voor het doel waarvoor het bedoeld is en in overeenstemming met de wet en deze voorwaarden.</li>
        <li>Niet toegestaan is onder meer: het platform verstoren of onveilig maken, geautomatiseerd gegevens verzamelen (scrapen), advertenties of gegevens van anderen oneigenlijk gebruiken, of je voordoen als een ander.</li>
        <li>Wij mogen (delen van) de dienst tijdelijk of blijvend aanpassen, beperken of stopzetten.</li>
      </ul>

      <h2>8. Persoonsgegevens</h2>
      <p>
        Wij gaan zorgvuldig om met persoonsgegevens en verwerken deze conform de AVG. Hoe wij dat
        doen, lees je in ons{" "}
        <Link href="/privacy">privacybeleid</Link>. Voor het plaatsen van cookies geldt ons{" "}
        <Link href="/cookies">cookiebeleid</Link>.
      </p>

      <h2>9. Aansprakelijkheid</h2>
      <ul>
        <li>Mooihuus levert de dienst “as is” en garandeert niet dat het platform ononderbroken, foutloos of volledig actueel beschikbaar is.</li>
        <li>Wij zijn niet aansprakelijk voor de inhoud of juistheid van advertenties, voor het aanbod van partners, of voor afspraken tussen gebruikers en/of partners onderling.</li>
        <li>Wij zijn niet aansprakelijk voor indirecte schade, gevolgschade, gederfde winst of gemiste besparingen.</li>
        <li>Voor zover wij wél aansprakelijk zijn, is die aansprakelijkheid beperkt tot het door jou aan Mooihuus betaalde bedrag voor de betreffende advertentie of dienst, behoudens opzet of bewuste roekeloosheid van Mooihuus.</li>
      </ul>

      <h2>10. Vrijwaring</h2>
      <p>
        Je vrijwaart Mooihuus tegen aanspraken van derden die verband houden met de inhoud die je
        plaatst, met jouw gebruik van het platform of met overeenkomsten die je met andere gebruikers
        of partners sluit.
      </p>

      <h2>11. Overmacht</h2>
      <p>
        Bij overmacht (omstandigheden buiten onze redelijke invloed, zoals storingen bij
        toeleveranciers, internet- of stroomuitval of overheidsmaatregelen) zijn wij niet gehouden
        onze verplichtingen na te komen zolang die situatie voortduurt.
      </p>

      <h2>12. Intellectueel eigendom</h2>
      <p>
        De naam Mooihuus, het logo en de vormgeving van het platform zijn eigendom van {COMPANY.bv}.
        Zonder toestemming mag je deze niet gebruiken.
      </p>

      <h2>13. Klachten en geschillen</h2>
      <p>
        Heb je een klacht over onze dienst? Mail dan naar {COMPANY.email} — we proberen er samen uit
        te komen. Consumenten binnen de EU kunnen een geschil ook voorleggen via het Europese
        ODR-platform (ec.europa.eu/consumers/odr).
      </p>

      <h2>14. Wijzigingen</h2>
      <p>Wij mogen deze voorwaarden en de dienst wijzigen. De actuele versie staat altijd op de website.</p>

      <h2>15. Slotbepalingen</h2>
      <ul>
        <li>Is een bepaling van deze voorwaarden nietig of vernietigbaar, dan blijven de overige bepalingen volledig van kracht; voor de betreffende bepaling geldt een zo gelijkwaardig mogelijke geldige regeling.</li>
        <li>Als wij een recht uit deze voorwaarden niet direct afdwingen, betekent dat geen afstand van dat recht.</li>
        <li>Wij mogen onze rechten en verplichtingen uit deze voorwaarden overdragen aan een derde, bijvoorbeeld bij een bedrijfsovername.</li>
      </ul>

      <h2>16. Toepasselijk recht</h2>
      <p>
        Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de
        bevoegde rechter in het arrondissement waar {COMPANY.bv} is gevestigd.
      </p>
    </LegalShell>
  );
}
