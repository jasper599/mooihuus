import { LegalShell } from "@/components/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Privacyverklaring — Mooihuus" };

export default function Privacy() {
  return (
    <LegalShell title="Privacyverklaring">
      <p>
        {COMPANY.bv} (“Mooihuus”) verwerkt persoonsgegevens zorgvuldig en conform de Algemene
        Verordening Gegevensbescherming (AVG). In deze verklaring lees je welke gegevens we
        verwerken en waarom.
      </p>

      <h2>1. Verwerkingsverantwoordelijke</h2>
      <p>
        {COMPANY.bv}, {COMPANY.adres}, {COMPANY.postcode}, KvK {COMPANY.kvk}. Vragen over privacy?
        Mail {COMPANY.privacyEmail}.
      </p>

      <h2>2. Welke gegevens en waarom</h2>
      <ul>
        <li><strong>Accountgegevens</strong> (naam, e-mail, wachtwoord in versleutelde vorm) — om je account en inlog te beheren. Grondslag: uitvoering van de overeenkomst.</li>
        <li><strong>Advertentiegegevens</strong> (woninggegevens, foto’s, prijs) — om je advertentie te tonen. Grondslag: uitvoering van de overeenkomst.</li>
        <li><strong>Betaalgegevens</strong> (bedrag, status, factuurnummer) — voor betaling en facturatie. De feitelijke betaling verloopt via onze betaaldienstverlener; wij ontvangen geen volledige bankgegevens. Grondslag: overeenkomst en wettelijke plicht (administratie).</li>
        <li><strong>Contact-/leadgegevens</strong> (naam, e-mail, bericht) — om een aanvraag door te geven aan de eigenaar. Grondslag: gerechtvaardigd belang.</li>
        <li><strong>Technische gegevens</strong> (zoals noodzakelijke cookies) — voor de werking en beveiliging van de site. Zie het cookiebeleid.</li>
      </ul>

      <h2>3. Delen met derden</h2>
      <p>Wij delen gegevens alleen wanneer nodig, met verwerkers onder een verwerkersovereenkomst:</p>
      <ul>
        <li><strong>Betaaldienstverlener</strong> (bijv. Mollie) — voor de afhandeling van betalingen.</li>
        <li><strong>E-maildienst</strong> — voor het versturen van transactionele e-mails (welkom, betalingsbewijs, lead-notificatie).</li>
        <li><strong>Verhuurpartners</strong> — klik je door naar het huuraanbod van een verhuurpartner, dan verlaat je Mooihuus en geldt op de site van die partner hun eigen privacybeleid. Wij delen daarbij zelf geen persoonsgegevens met de partner.</li>
        <li><strong>Hostingpartij</strong> — voor het draaien van het platform (bij voorkeur binnen de EU).</li>
      </ul>
      <p>Wij verkopen je gegevens niet aan derden.</p>

      <h2>4. Bewaartermijnen</h2>
      <p>
        We bewaren gegevens niet langer dan nodig. Account- en advertentiegegevens bewaren we zolang
        je een account hebt; financiële gegevens houden we aan conform de wettelijke bewaarplicht
        (in de regel 7 jaar).
      </p>

      <h2>5. Jouw rechten</h2>
      <p>
        Je hebt recht op inzage, correctie, verwijdering, beperking, bezwaar en overdraagbaarheid
        van je gegevens. Stuur je verzoek naar {COMPANY.privacyEmail}. Ben je het niet eens met hoe
        wij met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit
        Persoonsgegevens.
      </p>

      <h2>6. Beveiliging</h2>
      <p>
        We nemen passende technische en organisatorische maatregelen, waaronder versleuteling van
        wachtwoorden en beveiligde verbindingen.
      </p>
    </LegalShell>
  );
}
