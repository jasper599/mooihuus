# Mooihuus — MVP (compleet)

Het onafhankelijke platform waar particulieren hun recreatiewoning zelf in de etalage zetten.
Zelf de regie, nooit alleen. Een idee van Luyten Makelaardij.

Dit is een **complete, draaiende MVP**: profielen met login, een echte betaalflow (Mollie/iDEAL),
mooie merk-e-mails (welkom, betalingsbewijs, lead-notificatie) en een backoffice-dashboard.

## Starten

```bash
npm install
npm run dev        # http://localhost:3000
```

Productie: `npm run build && npm start`.

### Demo-accounts

| Rol | E-mail | Wachtwoord |
|---|---|---|
| Eigenaar | anouk@example.nl | welkom123 |
| Beheer (backoffice) | beheer@mooihuus.nl | beheer123 |

Of maak zelf een account via **Registreren** (je krijgt meteen een welkomstmail).

## Wat werkt end-to-end

- **Profielen & login** — registreren/inloggen (NextAuth, wachtwoorden gehasht met bcrypt), sessies, rollen (eigenaar/beheer).
- **Particulier én zakelijk account** — organisaties/parken/makelaars registreren met bedrijfsnaam (+ KvK) en beheren **meerdere objecten** onder één profiel.
- **Veelgestelde vragen** — `/faq`.
- **Chatbot (Huus-hulp)** — zwevende chatwidget op elke pagina. Werkt out-of-the-box met FAQ-gebaseerde antwoorden; met `ANTHROPIC_API_KEY` schakelt hij over op een echte LLM.
- **Meertalig (NL / EN / DE) op aparte URL-paden** — `/` (NL), `/en`, `/de` via `middleware.ts`. Per taal eigen `<html lang>`, canonical en hreflang-alternates; vertaalde publiekspagina's, chrome en chatbot. De taalwissel navigeert tussen de taalpaden. Vertaallaag in `lib/i18n.ts`.
- **Volumekorting** — vanaf 5 objecten automatisch 15% korting, vanaf 10 objecten 25% — zichtbaar bij afrekenen en op het betalingsbewijs.
- **SEO** — per-pagina titles/descriptions + Open Graph, `sitemap.xml` (met hreflang) en `robots.txt`, JSON-LD (Organization, WebSite, FAQPage, en per woning een Product/aanbieding), canonical + hreflang-alternates, semantische koppen.

> **Meertalige SEO:** de taal zit in de URL (`/`, `/en`, `/de`) met per-taal `<html lang>`, canonical en hreflang-alternates, plus een sitemap met taalvarianten — de nette, door Google gewenste opzet voor meertalige indexering.
- **Plaatsen met AI** — `/plaatsen`: wizard met AI-tekst, prijsindicatie en pakketkeuze.
- **Betalen (Mollie/iDEAL)** — bij plaatsen wordt een betaling aangemaakt; na betaling gaat de advertentie live.
- **Betalingsbewijs per e-mail** — factuurnummer, btw, methode — netjes in de huisstijl.
- **Leads rechtstreeks naar de eigenaar** — contact op een advertentie stuurt direct een nette notificatiemail naar de eigenaar.
- **Delen op social** — deelknoppen op elke advertentie: WhatsApp, Facebook, Instagram (kopieer link), X, e-mail, kopieer link én de native "Delen"-actie (mobiel). Nette Open Graph-preview bij het delen.
- **Advertentie zelf beheren** — de eigenaar kan een advertentie op **verkocht** zetten, **offline** halen, **weer online** zetten of **verwijderen** (met eigenaarscontrole).
- **Tevredenheidsenquête** — na het markeren als verkocht vult de eigenaar een korte enquête in (sterren + aanbeveling 0–10 + feedback). Resultaten en gemiddelden staan in het backoffice onder *Enquêtes*.
- **Factuur in je profiel** — onder *Account* vind je per betaling een formele factuur (Huus B.V., factuurnummer, btw-uitsplitsing, volumekorting), te bekijken en te **downloaden/printen als PDF** (`/factuur/[id]`, eigenaar-/beheer-geguard).
- **Uitjes in de buurt** — bij het plaatsen voeg je een postcode toe en **uitjes in de buurt**, met suggesties per provincie (`lib/uitjes.ts`). Ze verschijnen op de advertentie onder "Uitjes in de buurt". Integratiepunt: vervang de suggestielijst door een echte attracties-bron op postcodeniveau.
- **Eigenaar-dashboard** — eigen woningen, status, leads en betalingen.
- **Backoffice / CRM** (`/beheer`, alleen beheer-rol) — tabs voor **profielen, advertenties, betalingen, leads en de mailbox** (elke verzonden e-mail is in te zien).

## Demo-modus vs. productie

Zonder configuratie draait alles in **demo-modus**, zodat het overal werkt:

- **Betaling** — interne iDEAL-simulatie. Zet `MOLLIE_API_KEY` om echte iDEAL-betalingen + webhook te gebruiken.
- **E-mail** — preview: mails worden opgeslagen en getoond in het backoffice (én als `.html` in `data/outbox/`). Zet `SMTP_*` om echt te versturen.

Zie `.env.example`. Kopieer naar `.env.local` en vul in wat je wilt activeren. E-mail verstuurt vanaf **info@mooihuus.nl** (`MAIL_FROM`).

## Deploy op Railway

1. Push de code naar een Git-repo en maak in Railway een service vanaf die repo (Nixpacks detecteert Next.js automatisch; `next start` gebruikt automatisch Railway's `PORT`).
2. Zet de env-variabelen (zie `.env.example`): `NEXTAUTH_URL` = je productie-URL, `NEXTAUTH_SECRET`, `MOLLIE_API_KEY`, de `SMTP_*`-gegevens (of e-maildienst), en `ANTHROPIC_API_KEY` voor de chatbot.
3. Koppel het domein **mooihuus.nl** via Railway → Settings → Domains en zet bij je DNS de door Railway getoonde CNAME.
4. **Belangrijk voor productie:** de MVP bewaart data in `./data/db.json` (bestand) — op Railway is de containerschijf vluchtig. Koppel voor productie een **Postgres** (Railway-plugin) en vervang `lib/db.ts` door DB-queries; de functies eromheen blijven gelijk.

## Stack & structuur

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind** (huisstijl in `tailwind.config.ts`).
- **NextAuth** (credentials, JWT) — `lib/auth.ts`, `app/api/auth/[...nextauth]`.
- **Mollie** — `lib/mollie.ts`, betaalpagina `app/betaling/[id]`, webhook `app/api/webhook/mollie`.
- **E-mail** — `lib/email.ts` (merk-HTML templates + verzender).
- **Data** — `lib/db.ts`: persistente JSON-store in `./data/db.json` (seed bij eerste start).
  Vervang later door Postgres + Prisma; de functies eromheen blijven gelijk.

| Route | Scherm |
|---|---|
| `/` | Publiek aanbod |
| `/aanbod/[id]` | Advertentie + lead-formulier |
| `/registreren`, `/inloggen` | Account aanmaken / inloggen |
| `/plaatsen` | AI-wizard → betaling |
| `/betaling/[id]` | iDEAL-checkout (of simulatie) |
| `/dashboard` | Eigenaar: woningen, leads, betalingen |
| `/account` | Profiel + betalingen/bewijzen |
| `/beheer` | Backoffice/CRM (profielen, betalingen, mailbox…) |
| `/voorwaarden` `/privacy` `/cookies` `/disclaimer` | Juridische pagina's (Huus B.V.) + cookiemelding |
| `/faq` | Veelgestelde vragen |

## Nog niet in deze MVP (bewust)

- Kolibri-koppeling voor makelaars (latere fase).
- Belvilla-verhuur is als concept aanwezig (knop op dashboard); de echte doorplaatsing volgt.
- Productie-database, e-mail-domeinverificatie en Mollie-livekey zijn een kwestie van de env invullen.

## Juridisch (concept)

Onder de footer staan algemene voorwaarden, privacyverklaring (AVG), cookiebeleid en disclaimer,
op naam van **Huus B.V.** (exploitant van Mooihuus.nl). Er is een cookiemelding. Vul de
`[placeholders]` in `lib/company.ts` in (KvK, adres, btw) en **laat de teksten juridisch toetsen
vóór livegang** — het zijn goede startpunten, geen juridisch advies.
