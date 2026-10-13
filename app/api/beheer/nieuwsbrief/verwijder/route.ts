import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verwijderNieuwsbriefLid, verwijderNieuwsbriefLeden } from "@/lib/db";

export const runtime = "nodejs";

// Opschonen: verwijder één adres (email) of meerdere (emails[]) van de
// nieuwsbrieflijst. Alleen voor beheer.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  if (Array.isArray(b.emails) && b.emails.length) {
    const weg = verwijderNieuwsbriefLeden(b.emails);
    return NextResponse.json({ ok: true, verwijderd: weg });
  }
  const email = String(b.email || "").trim();
  if (!email) return NextResponse.json({ error: "Geen adres opgegeven." }, { status: 400 });
  const ok = verwijderNieuwsbriefLid(email);
  return NextResponse.json({ ok, verwijderd: ok ? 1 : 0 });
}
