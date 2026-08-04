import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stuurNieuwsteBlog } from "@/lib/nieuwsbrief";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const res = await stuurNieuwsteBlog(Boolean(b.force));
  return NextResponse.json({ ok: true, ...res });
}
