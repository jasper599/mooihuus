import { NextResponse } from "next/server";
import { addNieuwsbriefLid } from "@/lib/db";

const OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim();
  if (!OK.test(email)) {
    return NextResponse.json({ error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }
  addNieuwsbriefLid(email);
  // Altijd ok terugmelden (geen e-mailadres-enumeratie).
  return NextResponse.json({ ok: true });
}
