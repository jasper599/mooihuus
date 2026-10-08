// Next.js instrumentation — draait één keer bij het opstarten van de server.
// Start de interne dagelijkse scheduler (back-up + verloop/verlenging), zodat
// dit binnen het draaiende Node-proces gebeurt en geen externe cron nodig is.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();

    // Postgres-spiegel (Fase 1): schrijft op de achtergrond mee naar Postgres.
    // Volledig geïsoleerd en nooit fataal — als dit faalt draait de app gewoon
    // door op db.json. Start alleen als DATABASE_URL gezet is.
    try {
      const { initPgMirror, loadFromPg, markSynced, syncNaarPg } = await import("./lib/pg-mirror");
      await initPgMirror();

      // Fase 2: als PG_PRIMARY=1, draait de app ÓP Postgres — vul de cache bij
      // opstarten uit Postgres i.p.v. db.json, en zet write-through aan. Mislukt
      // dit, dan valt de app vanzelf terug op db.json (geen PG_PRIMARY-gedrag).
      if (process.env.PG_PRIMARY === "1") {
        try {
          const data = await loadFromPg();
          if (data) {
            const { setCacheFromPg, configurePgPrimary } = await import("./lib/db");
            setCacheFromPg(data);
            markSynced(data); // cache komt uit PG → geen overbodige her-sync
            configurePgPrimary(syncNaarPg);
            const n = Array.isArray((data as any).listings) ? (data as any).listings.length : 0;
            console.log(`[pg-primary] cache geladen uit Postgres (${n} woningen) — app draait nu op Postgres`);
          } else {
            console.error("[pg-primary] loadFromPg gaf niets bruikbaars terug — app valt terug op db.json");
          }
        } catch (e: any) {
          console.error("[pg-primary] fout bij laden uit Postgres — app valt terug op db.json:", e?.message || e);
        }
      }
    } catch {
      /* spiegel is optioneel — app draait door op db.json */
    }
  }
}
