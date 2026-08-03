import { NextResponse } from "next/server";
import { addReview } from "@/lib/db";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const naam = String(b.naam ?? "").trim();
  const plaats = String(b.plaats ?? "").trim();
  const tekst = String(b.tekst ?? "").trim();
  const rating = Number(b.rating);

  if (!naam) return NextResponse.json({ error: "Vul je naam in." }, { status: 400 });
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Geef een beoordeling van 1 tot 5 sterren." }, { status: 400 });
  }
  if (tekst.length < 5) return NextResponse.json({ error: "Schrijf kort waarom je deze beoordeling geeft." }, { status: 400 });

  const rev = addReview({
    naam: naam.slice(0, 60),
    plaats: plaats ? plaats.slice(0, 60) : undefined,
    rating,
    tekst: tekst.slice(0, 800),
  });
  return NextResponse.json({ ok: true, id: rev.id });
}
