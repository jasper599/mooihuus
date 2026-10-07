import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addKortingscode, updateKortingscode, getKortingscodeByCode, getKortingscode } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const actie = String(b?.actie || "maak");

  if (actie === "toggle") {
    const k = getKortingscode(String(b?.id || ""));
    if (!k) return NextResponse.json({ error: "Code niet gevonden." }, { status: 404 });
    const upd = updateKortingscode(k.id, { actief: !k.actief });
    return NextResponse.json({ ok: true, code: upd });
  }

  // maak
  const code = String(b?.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{1,23}$/.test(code)) {
    return NextResponse.json({ error: "Kies een code van 2–24 tekens (letters, cijfers of streepje)." }, { status: 422 });
  }
  if (getKortingscodeByCode(code)) {
    return NextResponse.json({ error: "Deze code bestaat al." }, { status: 409 });
  }
  const type = ["procent", "bedrag", "gratis"].includes(String(b?.type)) ? String(b.type) : "procent";
  const doel = ["alles", "advertentie", "opvaller"].includes(String(b?.doel)) ? String(b.doel) : "alles";
  const waarde = Number(b?.waarde) || 0;
  if (type === "procent" && (waarde <= 0 || waarde > 100)) {
    return NextResponse.json({ error: "Een procent-korting moet tussen 1 en 100 zijn." }, { status: 422 });
  }
  if (type === "bedrag" && waarde <= 0) {
    return NextResponse.json({ error: "Vul een bedrag groter dan 0 in." }, { status: 422 });
  }
  const vervalt = b?.vervalt ? new Date(String(b.vervalt)).toISOString() : undefined;
  const maxGebruik = b?.maxGebruik ? Math.max(1, Math.floor(Number(b.maxGebruik))) : undefined;

  const k = addKortingscode({
    code,
    type: type as any,
    waarde,
    doel: doel as any,
    vervalt,
    maxGebruik,
    notitie: b?.notitie ? String(b.notitie).slice(0, 120) : undefined,
  });
  return NextResponse.json({ ok: true, code: k });
}
