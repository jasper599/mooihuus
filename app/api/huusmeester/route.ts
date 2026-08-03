import { NextResponse } from "next/server";
import { addHuusmeester } from "@/lib/db";

export async function POST(req: Request) {
  const b = await req.json();
  const bedrijf = String(b.bedrijf || "").trim();
  const naam = String(b.naam || "").trim();
  const vak = String(b.vak || "").trim();
  const regio = String(b.regio || "").trim();
  const email = String(b.email || "").trim();

  if (!bedrijf || !naam || !vak || !email) {
    return NextResponse.json({ error: "Vul je bedrijf, naam, vak en e-mail in." }, { status: 400 });
  }

  const hm = addHuusmeester({ bedrijf, naam, vak, regio: regio || "Landelijk", email });
  return NextResponse.json({ ok: true, id: hm.id });
}
