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
      const { initPgMirror } = await import("./lib/pg-mirror");
      await initPgMirror();
    } catch {
      /* spiegel is optioneel — app draait door op db.json */
    }
  }
}
