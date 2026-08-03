# Mooihuus — deployen naar Railway

Het Railway-project is al voor je aangemaakt en ingesteld (project **Mooihuus**, service **web**,
production-omgeving). De env-variabelen (NEXTAUTH_URL, NEXTAUTH_SECRET, MOLLIE_API_KEY (test),
MAIL_FROM, DATA_DIR, PORT) staan er al op. Jij hoeft alleen de code te uploaden.

## Deployen (één keer in de terminal)

Vanuit deze projectmap:

```bash
npm i -g @railway/cli          # Railway CLI installeren (eenmalig)
railway login                  # opent de browser om in te loggen
railway link                   # kies: Mooihuus → production → web
railway up                     # bouwt en deployt deze map
```

`railway up` bouwt de Next.js-app (Nixpacks detecteert dit automatisch) en zet 'm live op:

**https://web-production-31862.up.railway.app**

Volg de build/log met `railway logs` of in het Railway-dashboard.

## Na de eerste deploy

- **Testen:** open de URL, maak een account en plaats een woning. Bij het afrekenen ga je nu naar
  de **echte Mollie iDEAL-testcheckout**. Kies een testbank + uitkomst (betaald). De webhook
  (`/api/webhook/mollie`) werkt nu ook, dus de advertentie gaat live en je krijgt het
  betalingsbewijs.
- **Chatbot op echte AI:** voeg in Railway de variabele `ANTHROPIC_API_KEY` toe.
- **Eigen domein (www.mooihuus.nl):** het domein is al toegevoegd aan de Railway-service. Zet bij
  **Hostnet** in het DNS-beheer van mooihuus.nl één CNAME-record:
  - Type: **CNAME** · Naam/host: **www** · Waarde: het adres dat Railway toont naast
    `www.mooihuus.nl` (Settings → Networking), bijv. `azkwl63x.up.railway.app` · TTL: standaard.
  - Laat de **MX-records** (mail) en overige records ongemoeid — die blijven bij Hostnet.
  - Voor het kale domein zonder www (`mooihuus.nl`) zet je bij Hostnet een **doorstuur/redirect**
    naar `https://www.mooihuus.nl` (URL-forwarding), of een CNAME/ALIAS als Hostnet dat op de root
    toestaat.
  - DNS is meestal binnen 15–60 min actief (soms tot 24 u). Railway zet daarna automatisch een
    gratis SSL-certificaat. Pas dán `NEXTAUTH_URL` aan naar `https://www.mooihuus.nl`.
- **Favicon:** staat er al in (`app/icon.png` + `app/apple-icon.png`, het Mooihuus-icoon). Verschijnt
  automatisch in de browsertab en op mobiel.
- **Live betalingen:** vervang t.z.t. `MOLLIE_API_KEY` door je `live_`-key (na goedkeuring bij Mollie).

## Persistente opslag (belangrijk voor productie)

De MVP slaat data op in een bestand (`$DATA_DIR/db.json`, ingesteld op `/app/data`). Op Railway is
de containerschijf vluchtig — bij een nieuwe deploy begint de data opnieuw. Kies één van:

1. **Snel:** koppel een **Volume** aan de service met mount-pad `/app/data` (Railway → service →
   Settings → Volumes). Dan blijft de data bewaard.
2. **Productie:** voeg een **Postgres** toe (Railway-plugin) en vervang `lib/db.ts` door
   database-queries; de functies eromheen blijven gelijk.

Voor een eerste live test van de iDEAL-flow is optie 1 (of zelfs niets) prima.
