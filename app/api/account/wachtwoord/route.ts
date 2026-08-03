import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkWachtwoord, setWachtwoord } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  const b = await req.json();
  const huidig = String(b.huidig || "");
  const nieuw = String(b.nieuw || "");
  if (nieuw.length < 6) {
    return NextResponse.json({ error: "Je nieuwe wachtwoord moet minstens 6 tekens zijn." }, { status: 400 });
  }
  if (!checkWachtwoord(userId, huidig)) {
    return NextResponse.json({ error: "Je huidige wachtwoord klopt niet." }, { status: 400 });
  }
  setWachtwoord(userId, nieuw);
  return NextResponse.json({ ok: true });
}
