import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUser, updateUser } from "@/lib/db";
import { maakAkkoord } from "@/lib/voorwaarden";

// Legt vast dat de ingelogde gebruiker akkoord gaat met de actuele versie
// van de algemene voorwaarden en huisregels (versie + tijdstip).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.akkoord !== true) return NextResponse.json({ error: "Vink het akkoord aan." }, { status: 400 });
  updateUser(userId, { voorwaardenAkkoord: maakAkkoord("dashboard") });
  return NextResponse.json({ ok: true });
}

// Of de ingelogde gebruiker al eens akkoord gaf (dan tonen we geen vinkje meer).
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ akkoord: false });
  return NextResponse.json({ akkoord: !!getUser(userId)?.voorwaardenAkkoord });
}
