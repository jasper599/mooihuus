import { NextResponse } from "next/server";
import { getZoekopdrachten, verwijderZoekopdrachten } from "@/lib/db";
import { lijktWartaal } from "@/lib/antispam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TIJDELIJK: eenmalige opschoonactie voor bot-woning-alerts (wartaal-namen).
// Na gebruik verwijderen. Beveiligd met een wegwerp-sleutel.
const KEY = "mh-opschoon-5b1d7f3a9c2e4860";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const alle = getZoekopdrachten();
  const bots = alle.filter((z) => lijktWartaal(z.naam || ""));
  const doit = url.searchParams.get("doit") === "1";

  if (!doit) {
    return NextResponse.json({
      ok: true,
      modus: "preview",
      totaalAlerts: alle.length,
      kandidaten: bots.length,
      voorbeelden: bots.slice(0, 40).map((z) => ({ naam: z.naam, email: z.email, datum: z.datum })),
    });
  }
  const verwijderd = verwijderZoekopdrachten(bots.map((z) => z.id));
  return NextResponse.json({ ok: true, modus: "verwijderd", verwijderd, resterend: getZoekopdrachten().length });
}
