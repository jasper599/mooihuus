import { NextResponse } from "next/server";
import { gebruikResetToken, setWachtwoord } from "@/lib/db";

export async function POST(req: Request) {
  const b = await req.json();
  const token = String(b.token || "");
  const nieuw = String(b.nieuw || "");
  if (nieuw.length < 6) {
    return NextResponse.json({ error: "Je nieuwe wachtwoord moet minstens 6 tekens zijn." }, { status: 400 });
  }
  const user = gebruikResetToken(token);
  if (!user) {
    return NextResponse.json({ error: "Deze resetlink is ongeldig of verlopen. Vraag een nieuwe aan." }, { status: 400 });
  }
  setWachtwoord(user.id, nieuw);
  return NextResponse.json({ ok: true });
}
