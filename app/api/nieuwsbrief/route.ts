import { NextResponse } from "next/server";
import { addNieuwsbriefLid } from "@/lib/db";
import { isSpam } from "@/lib/antispam";

const OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim();
  if (!OK.test(email)) {
    return NextResponse.json({ error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }
  // Bots: honeypot gevuld of binnen enkele honderden ms ingestuurd. Stil
  // accepteren (ok terug) maar niet aanmelden — zo leert de bot niets.
  if (isSpam({ email, honeypot: b.bedrijf, ts: b.ts })) {
    return NextResponse.json({ ok: true });
  }
  addNieuwsbriefLid(email);
  // Altijd ok terugmelden (geen e-mailadres-enumeratie).
  return NextResponse.json({ ok: true });
}
