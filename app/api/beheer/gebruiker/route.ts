import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteUser } from "@/lib/db";

// Verwijdert een profiel uit het beheer (alleen voor beheerders). Wordt gebruikt
// om spam-registraties op te ruimen. De db-laag beschermt systeemaccounts en
// accounts met woningen.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Geen id." }, { status: 400 });

  const res = deleteUser(String(id));
  if (!res.ok) return NextResponse.json({ error: res.reden || "Verwijderen mislukt." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
