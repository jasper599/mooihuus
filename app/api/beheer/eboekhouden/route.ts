import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncBetalingen } from "@/lib/eboekhouden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Beheer: betaalde facturen naar e-Boekhouden. { dry: true } = proefronde
// (toont alleen wat er geboekt zou worden), { dry: false } = echt boeken.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const dry = body?.dry !== false;
  try {
    return NextResponse.json(await syncBetalingen({ dry }));
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
