import { LegalShell } from "@/components/LegalShell";
import { COMPANY } from "@/lib/company";

// Elk uur opnieuw opbouwen, zodat o.a. het adres na de verhuizing (15-12-2026) vanzelf klopt.
export const revalidate = 3600;

export const metadata = { title: "Disclaimer" };

export default function Disclaimer() {
  return (
    <LegalShell title="Disclaimer">
      <h2>Wie zijn wij</h2>
      <p>
        Mooihuus.nl en Woonhuus.nl worden aangeboden door {COMPANY.bv}, {COMPANY.adres}, {COMPANY.postcode},
        KvK {COMPANY.kvk}, btw {COMPANY.btw}. Contact: {COMPANY.email}. Wij besteden veel zorg aan de inhoud
        van deze websites, maar kunnen niet garanderen dat alles altijd juist, volledig en actueel is.
      </p>

      <h2>Recreatiewoningen en gewone woningen</h2>
      <p>
        Mooihuus.nl toont recreatiewoningen; Woonhuus.nl toont gewone koopwoningen. Een recreatiewoning is
        bedoeld om recreatief van te genieten en niet voor permanente bewoning, tenzij de gemeente dat
        uitdrukkelijk toestaat. Vermeldingen over bewoning, bestemming of verhuur in advertenties zijn
        afkomstig van de aanbieder; controleer dit altijd zelf bij de gemeente. Op Woonhuus.nl bieden wij
        uitsluitend de advertentie aan en begeleiden wij de verkoop niet.
      </p>

      <h2>Advertenties van makelaars en particulieren</h2>
      <p>
        Advertenties worden geplaatst door makelaars en particulieren. {COMPANY.bv} is geen makelaar, niet
        de verkoper en geen partij bij overeenkomsten die tussen aanbieders en geïnteresseerden tot stand
        komen. De aanbieder is verantwoordelijk voor de inhoud van zijn advertentie. Bij elke woning
        vermelden wij of deze wordt aangeboden door een makelaar of door een particulier. Koop je van een
        particulier, houd er dan rekening mee dat de regels voor consumentenbescherming die gelden bij een
        aankoop van een bedrijf dan niet van toepassing zijn.
      </p>

      <h2>Woninggegevens</h2>
      <p>
        Gegevens zoals vraagprijs, woonoppervlakte, perceelgrootte, bouwjaar, energielabel, kosten en
        ligging komen van de aanbieder of uit het systeem van de makelaar. Wij controleren deze niet.
        Oppervlaktes en andere kenmerken kunnen afwijken; aan de getoonde gegevens kunnen geen rechten
        worden ontleend. Controleer belangrijke informatie altijd zelf en rechtstreeks bij de aanbieder,
        bijvoorbeeld tijdens een bezichtiging.
      </p>

      <h2 id="rangschikking">Volgorde van de woningen en uitgelichte woningen</h2>
      <p>
        Standaard tonen we eerst de uitgelichte woningen en daarna de overige woningen, nieuwste eerst.
        Een woning is uitgelicht als de aanbieder daarvoor heeft betaald (bijvoorbeeld met het pakket
        Premium of een losse optie om op te vallen) of als het aanbod van een partner van ons is. Uitgelichte
        woningen herken je aan het label “Uitgelicht”. Je kunt de volgorde zelf aanpassen, bijvoorbeeld
        op prijs, en filteren op provincie, type, prijs en oppervlakte.
      </p>

      <h2>Prijsindicaties, maandlasten, AI-teksten en vertalingen</h2>
      <p>
        Hulpmiddelen zoals prijsindicaties, de maandlastencalculator, door AI voorgestelde teksten en
        automatische vertalingen zijn indicatief en zonder garantie. De maandlastencalculator is geen
        hypotheekadvies. Bij vertalingen is de Nederlandse tekst leidend.
      </p>

      <h2>Iets onjuists of onrechtmatigs gezien?</h2>
      <p>
        Zie je een advertentie of andere inhoud die volgens jou niet klopt, misleidend is of in strijd is
        met de wet, meld het ons via {COMPANY.email} of het <a href="/contact">contactformulier</a>. Vermeld
        om welke woning of pagina het gaat en waarom. We bevestigen je melding, beoordelen die zorgvuldig en
        laten je weten wat we ermee doen. Halen we een advertentie weg of beperken we die, dan laten we de
        aanbieder weten waarom. Dit adres is ook ons contactpunt voor gebruikers en autoriteiten.
      </p>

      <h2>Externe links en partners</h2>
      <p>
        Onze websites kunnen verwijzen naar diensten van derden, zoals verhuurpartners, de Huusmeesters,
        hypotheekpartners of Mollie voor betalingen. Op die diensten zijn de voorwaarden en het privacybeleid
        van die partijen van toepassing; {COMPANY.bv} is daar niet verantwoordelijk voor.
      </p>

      <h2>Beschikbaarheid</h2>
      <p>
        Wij streven ernaar de websites altijd bereikbaar te houden, maar kunnen niet garanderen dat zij
        zonder onderbreking of fouten werken.
      </p>

      <h2>Aansprakelijkheid</h2>
      <p>
        {COMPANY.bv} aanvaardt geen aansprakelijkheid voor schade die voortvloeit uit het gebruik van
        deze websites of het vertrouwen op de daarop getoonde informatie, behoudens opzet of bewuste
        roekeloosheid. Zie ook onze <a href="/voorwaarden">algemene voorwaarden</a>.
      </p>
    </LegalShell>
  );
}
