import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importFeed, adapterVoor } from "@/lib/feed-import";

export const runtime = "nodejs";

// Handmatig een feed-synchronisatie starten (beheer). Werkt zodra de adapter
// van de betreffende bron is geconfigureerd; tot die tijd meldt hij dat netjes.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const { bron } = await req.json().catch(() => ({}));
  try {
    const res = await importFeed(adapterVoor(String(bron || "kolibri")));
    return NextResponse.json({ ok: true, ...res });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Import mislukt." }, { status: 501 });
  }
}
