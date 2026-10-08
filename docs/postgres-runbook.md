# Draaiboek — overstap naar Postgres (Spoor 2)

Doel: de bestandsdatabase (`data/db.json`) vervangen door Postgres, zonder
dataverlies en zonder de live betalingen ook maar één moment in gevaar te brengen.
De aanpak is in twee fases geknipt, met op elk moment een directe terugval.

## Status

- [x] **Fase 1 — schaduwfase: LIVE en geverifieerd (2026-10-08).**
      De app draait nog volledig op `db.json`. Een geïsoleerde achtergrond-spiegel
      (`lib/pg-mirror.ts`) kopieert alles naar Postgres en vergelijkt de aantallen.
      Eerste sync: 10.495 rijen, `gelijk: true` (Postgres identiek aan db.json).
- [ ] **Fase 2 — omschakeling**: de app laten *lezen* uit Postgres i.p.v. db.json.
      Nog niet gedaan; wacht op (a) geslaagde soak, (b) verse back-up, (c) 'go' van Jasper.

## Wat er al staat en draait

- `prisma/schema.prisma` — datamodel (16 tabellen `{id, data(JSONB), bijgewerkt}` + `Meta` key/value).
- Postgres-service in Railway, `DATABASE_URL` gekoppeld aan de web-service.
- Build draait `prisma generate` (schema is op Railway gevalideerd ✓).
- `lib/pg-mirror.ts` — de schaduwspiegel:
  - maakt de tabellen zelf aan (`CREATE TABLE IF NOT EXISTS`), geen handmatige `prisma db push` nodig;
  - seedt Postgres bij boot (bulk) en synct daarna elke 60s alleen gewijzigde/nieuwe/verwijderde rijen;
  - volledig `try/catch`, nooit fataal — faalt Postgres, dan draait de app ongestoord door op db.json;
  - logt na elke sync met wijzigingen `[pg-mirror] sync ok {... "gelijk":true ...}` (secret-vrij leesbaar in de Railway-logs).
- `app/api/cron/pg-status` — gated endpoint (CRON_SECRET of beheerder) dat db.json vs Postgres vergelijkt.
- `scripts/migrate-to-postgres.ts` — losse eenmalige import (reserve; de spiegel doet dit nu al automatisch).

## Fase 2 — de omschakeling (flag-gestuurd, terugval = één variabele)

Opzet zodat de *code-deploy* en de *echte omschakeling* losgekoppeld zijn:

1. **Code achter een vlag.** Nieuwe env-variabele `PG_PRIMARY`.
   - `PG_PRIMARY` **niet** gezet (standaard) = exact het huidige gedrag: lezen/schrijven via db.json.
   - `PG_PRIMARY=1` = bij boot vult de app `cache` uit Postgres (via `loadFromPg()` in
     instrumentation.ts, vóór de eerste request), en elke `save()` schrijft de wijziging
     meteen door naar Postgres. `db.json` blijft dan nog als vangnet meeschrijven.
   - Schets `loadFromPg()`: voor elke collectie `prisma[model].findMany()` → `rows.map(r => r.data)`;
     meta-rijen terug naar losse sleutels; sanity-check (moet users bevatten) anders terugvallen op db.json.
2. **Deploy met vlag UIT.** Verandert niks aan het live-gedrag → veilig op elk moment uit te rollen.
3. **Verse back-up** vlak vóór de flip (zie onder). Zonder back-up flippen we niet.
4. **Flip:** zet `PG_PRIMARY=1` op de web-service → herstart. App leest nu uit Postgres.
5. **Terugval (instant):** haal `PG_PRIMARY` weg → herstart. App leest weer uit db.json,
   dat al die tijd is bijgewerkt. Geen rollback-deploy nodig, geen dataverlies.
6. **Testen (vóór we het "af" noemen):** woning plaatsen, testbetaling, opvaller,
   kortingscode (gratis), Kolibri-sync, social spotlight, nieuwsbrief + woning-alert
   aan-/afmelden, beheer-overzichten. Controleer `[pg-mirror]`-logs en `/api/cron/pg-status` → `gelijk:true`.
7. **Nazorg:** een dag meekijken. Daarna (Fase 2b) mag het hele db.json-wegschrijven eruit
   en wordt db.json nog enkel als periodieke snapshot-back-up bewaard — dát is de echte
   schaalbaarheidswinst (niet meer het hele bestand per wijziging herschrijven).

## Back-up maken (vóór de flip)

De app heeft een ingebouwde back-up: dagelijks automatisch (volume-rotatie, 14 kopieën,
+ off-site mail). Handmatig vooraf forceren kan via `GET /api/cron/backup?key=CRON_SECRET`
of als ingelogde beheerder. Resultaat: `db-<timestamp>.json` op het volume (map `backups/`)
en als mailbijlage.

## Terugval-samenvatting

| Probleem | Actie | Dataverlies |
|---|---|---|
| Spiegel faalt (Fase 1) | niets — app draait op db.json | nee |
| Flip gaat mis (Fase 2) | `PG_PRIMARY` weghalen + herstart | nee (db.json bijgewerkt) |
| Postgres helemaal plat | `PG_PRIMARY` weg; evt. Railway rollback | nee |
