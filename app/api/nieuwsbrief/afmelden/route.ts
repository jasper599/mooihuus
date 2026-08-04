import { NextResponse } from "next/server";
import { verwijderNieuwsbriefLid } from "@/lib/db";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim();
  if (!email) return NextResponse.json({ ok: false }, { status: 400 });
  verwijderNieuwsbriefLid(email);
  return NextResponse.json({ ok: true });
}
