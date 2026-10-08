# Draaiboek — overstap naar Postgres (Spoor 2)

Doel: de bestandsdatabase (`data/db.json`) vervangen door Postgres, zonder
dataverlies en met minimale downtime. De live site blijft draaien tot de
allerlaatste omschakeling.

## Aanpak (gekozen: "write-through", risico-arm)
- Elke soort krijgt een eigen tabel met het object als JSON (zie `prisma/schema.prisma`).
- Bij opstarten laadt de app alle rijen één keer in het geheugen (zoals nu db.json)
  → alle zoeken/filteren blijft synchroon en snel; app-code verandert nauwelijks.
- Bij een wijziging schrijft de app alleen díe ene rij weg naar Postgres (geen heel
  bestand meer herschrijven). Atomair en veilig bij veel tegelijk.
- `data/db.json` blijft als vangnet nog één release meelopen.

## Vooraf (klaar in deze repo)
- [x] `prisma/schema.prisma` — datamodel (16 tabellen + Meta key/value)
- [x] `scripts/migrate-to-postgres.ts` — eenmalige import van db.json → Postgres
- [x] `prisma` + `@prisma/client` als dependency toegevoegd

## Stappen op kantoor (laptop open, Mac verbonden)
1. **Back-up**: kopieer de live `data/db.json` van het Railway-volume (handmatige
   download of via de bestaande dagelijkse back-up). Zonder back-up beginnen we niet.
2. **Postgres aanzetten** in Railway: project Mooihuus → New → Database → PostgreSQL.
   Railway zet dan `DATABASE_URL` klaar; koppel die als variabele aan de web-service.
3. **Code**: `lib/db.ts` intern omzetten naar de write-through-laag (reads uit cache,
   writes per rij naar Postgres). Build/`postinstall` voert `prisma generate` uit.
   → Dit bouwen + testen we hier samen; de publieke functies blijven hetzelfde.
4. **Tabellen aanmaken**: `prisma db push` (maakt de tabellen op basis van het schema).
5. **Data overzetten**: `DATABASE_URL=... npx tsx scripts/migrate-to-postgres.ts`
   (leest db.json, vult Postgres). Script is idempotent.
6. **Uitrollen** via de Mac → GitHub → Railway.
7. **Testen (vóór we het "af" noemen)**: woning plaatsen, testbetaling, opvaller,
   kortingscode (gratis), Kolibri-sync, social spotlight, nieuwsbrief + woning-alert
   aanmelden/afmelden, beheer-overzichten. Pas bij groen: klaar.
8. **Nazorg**: een dag meekijken; daarna mag de db.json-vangnetcode eruit.

## Terugval
Gaat er iets mis bij de omschakeling, dan zetten we de vorige versie terug
(Railway rollback) — die leest gewoon weer uit db.json. Geen dataverlies, want
db.json blijft tot de nazorg-fase intact.
