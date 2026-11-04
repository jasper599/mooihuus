import Link from "next/link";
import { LegalShell } from "@/components/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Algemene voorwaarden" };

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
      <p>
        Het platform bestaat uit twee websites: <strong>Mooihuus.nl</strong> voor recreatiewoningen en{" "}
        <strong>Woonhuus.nl</strong> voor gewone koopwoningen. Woonhuus.nl is een onderdeel van
        Mooihuus en wordt door dezelfde vennootschap geëxploiteerd. Accounts, inloggen, betalingen en
        facturatie lopen voor beide websites via Mooihuus.nl. Waar in deze voorwaarden “Mooihuus” of “het
        platform” staat, wordt ook Woonhuus.nl bedoeld.
      </p>

      <h2>2. Wat Mooihuus is (en niet is)</h2>
      <p>
        Mooihuus is een online <strong>advertentie- en informatieplatform</strong> rondom de
        recreatiewoning. Particulieren en makelaars kunnen er hun recreatiewoning te koop of te huur
        aanbieden. Gewone woningen (bestemd voor permanente bewoning) worden getoond op Woonhuus.nl. Of een
        woning op Mooihuus.nl of op Woonhuus.nl verschijnt, bepalen wij op basis van de gegevens van de
        aanbieder of de makelaar; wij mogen een woning naar de passende website verplaatsen. Daarnaast brengt Mooihuus gebruikers in contact met partners en vakmensen voor
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

      <h2>2a. Recreatiewoningen en gewone woningen</h2>
      <p>
        Het platform maakt onderscheid tussen twee soorten woningen. Welke soort een woning is, bepaalt
        op welke website zij verschijnt en welke dienstverlening daarbij hoort.
      </p>
      <ul>
        <li>
          <strong>Recreatiewoningen</strong> (zoals chalets, bungalows, tiny houses en vakantiehuizen) worden
          getoond op Mooihuus.nl. Een recreatiewoning is bedoeld om recreatief van te genieten en niet voor
          permanente bewoning. Of en in hoeverre (tijdelijke) bewoning is toegestaan, wordt bepaald door het
          bestemmingsplan en de regels van de betreffende gemeente en het park; de aanbieder vermeldt dit naar
          waarheid en de koper of huurder controleert dit zelf.
        </li>
        <li>
          <strong>Gewone woningen</strong> (woningen bestemd voor permanente bewoning, zoals eengezinswoningen,
          appartementen en starterswoningen) worden getoond op Woonhuus.nl, uitsluitend <strong>te koop</strong>.
          Gewone woningen te huur bieden wij niet aan; zulke advertenties worden niet geplaatst of verwijderd.
        </li>
      </ul>
      <p>
        <strong>Verschil in dienstverlening.</strong> Bij recreatiewoningen kan Mooihuus de aanbieder breder
        ondersteunen, bijvoorbeeld met hulp bij teksten, waardeindicaties, contracten en doorverwijzing naar
        vakmensen (de “Huusmeesters”), zoals per dienst in het platform beschreven. Bij gewone woningen op
        Woonhuus.nl bieden wij <strong>uitsluitend de advertentie</strong> aan: wij begeleiden de verkoop niet,
        geven geen advies over prijs, financiering of juridische zaken en zijn geen partij bij
        onderhandelingen of de koopovereenkomst.
      </p>
      <p>
        <strong>Indeling.</strong> Wij delen een woning in op basis van de gegevens die de aanbieder of de makelaar
        aanlevert, bijvoorbeeld het recreatiekenmerk in het makelaarssysteem (zoals Kolibri of Realworks) of de
        keuze die een particulier bij het plaatsen maakt. Wij mogen een woning naar de passende website
        verplaatsen, een indeling corrigeren of een advertentie weigeren die niet past bij de website waarop
        zij zou verschijnen. Een verplaatsing heeft geen gevolgen voor de looptijd of de prijs van de advertentie.
      </p>
      <p>
        <strong>Makelaars en particulieren.</strong> Op beide websites kunnen zowel makelaars als particulieren
        adverteren. Makelaars leveren hun aanbod doorgaans automatisch aan via een koppeling met hun
        makelaarssysteem; de makelaar blijft verantwoordelijk voor de juistheid en actualiteit van dat aanbod en
        voor de keuze welke woningen via die koppeling naar het platform worden gestuurd.
      </p>
      <p>
        <strong>Kosten en facturatie voor makelaars.</strong> Voor woningen die via een makelaarskoppeling
        binnenkomen geldt een vast bedrag per woning per jaar, ongeacht of de woning op Mooihuus.nl of op
        Woonhuus.nl wordt getoond. Een woning gaat online nadat de factuur is betaald. Wordt een factuur niet
        binnen de gestelde termijn betaald, dan vervalt de betaallink, ontvangt de makelaar een creditnota en
        blijft de woning offline. Op de factuur staat bij elke woning op welke website zij verschijnt.
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
        <li>Je plaatst je advertentie in het <strong>Nederlands</strong>. Mooihuus mag aangeleverde titel- en omschrijvingsteksten automatisch naar het Nederlands normaliseren, en toont daarnaast automatisch (machinaal) gegenereerde vertalingen, waaronder Duits en Engels. De Nederlandse versie is leidend; vertalingen zijn indicatief en hieraan kunnen geen rechten worden ontleend.</li>
      </ul>

      <h2>4a. Volgorde van de woningen en betaalde zichtbaarheid</h2>
      <p>
        Standaard tonen wij eerst uitgelichte woningen en daarna de overige woningen, nieuwste eerst.
        Uitlichting is een betaalde dienst (zoals het pakket Premium of een losse optie om op te vallen) of
        geldt voor aanbod van onze partners, en is zichtbaar met het label “Uitgelicht”. Bezoekers kunnen de
        volgorde zelf wijzigen en filteren. Andere factoren dan deze gebruiken wij niet voor de volgorde.
      </p>

      <h2>4b. Melden, verwijderen en bezwaar</h2>
      <ul>
        <li>Iedereen kan inhoud die onjuist, misleidend of onrechtmatig lijkt bij ons melden via {COMPANY.email} of het contactformulier. Wij bevestigen de melding, beoordelen die zorgvuldig en laten de melder weten wat wij ermee doen.</li>
        <li>Wij mogen advertenties weigeren, aanpassen, offline halen of verwijderen als zij in strijd zijn met deze voorwaarden of de wet, of niet passen bij de website waarop zij verschijnen. Wij laten de aanbieder dan weten waarom.</li>
        <li>Ben je het niet eens met een besluit over jouw advertentie of melding, dan kun je binnen zes maanden bezwaar maken via {COMPANY.email}. Wij beoordelen je bezwaar opnieuw en laten je de uitkomst weten.</li>
        <li>{COMPANY.email} is ons contactpunt voor gebruikers en autoriteiten.</li>
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
