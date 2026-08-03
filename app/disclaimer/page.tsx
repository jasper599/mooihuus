import { LegalShell } from "@/components/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Disclaimer — Mooihuus" };

export default function Disclaimer() {
  return (
    <LegalShell title="Disclaimer">
      <h2>Algemeen</h2>
      <p>
        Deze website en dienst worden aangeboden door {COMPANY.bv}. Wij besteden veel zorg aan de
        inhoud, maar kunnen niet garanderen dat alles altijd juist, volledig en actueel is.
      </p>

      <h2>Advertenties van gebruikers</h2>
      <p>
        Advertenties worden geplaatst door gebruikers (particulieren en makelaars). {COMPANY.bv} is
        niet verantwoordelijk voor de juistheid of volledigheid van die advertenties, en is geen
        partij bij overeenkomsten die tussen gebruikers tot stand komen. Controleer belangrijke
        informatie altijd zelf en rechtstreeks bij de aanbieder.
      </p>

      <h2>Prijsindicaties en AI-teksten</h2>
      <p>
        Hulpmiddelen zoals prijsindicaties en door AI voorgestelde teksten zijn indicatief en zonder
        garantie. De eigenaar blijft verantwoordelijk voor de uiteindelijke inhoud en prijs.
      </p>

      <h2>Externe links en partners</h2>
      <p>
        Onze site kan verwijzen naar diensten van derden (zoals Belvilla voor verhuur of Mollie voor
        betalingen). Op die diensten zijn de voorwaarden en het privacybeleid van die partijen van
        toepassing; {COMPANY.bv} is daar niet verantwoordelijk voor.
      </p>

      <h2>Aansprakelijkheid</h2>
      <p>
        {COMPANY.bv} aanvaardt geen aansprakelijkheid voor schade die voortvloeit uit het gebruik van
        deze website of het vertrouwen op de daarop getoonde informatie, behoudens opzet of bewuste
        roekeloosheid. Zie ook onze <a href="/voorwaarden">algemene voorwaarden</a>.
      </p>
    </LegalShell>
  );
}
