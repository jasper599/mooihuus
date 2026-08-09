// Next.js instrumentation — draait één keer bij het opstarten van de server.
// Start de interne dagelijkse scheduler (back-up + verloop/verlenging), zodat
// dit binnen het draaiende Node-proces gebeurt en geen externe cron nodig is.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
