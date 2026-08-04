import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUser, updateUser } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  const user = getUser(userId);
  if (!user) return NextResponse.json({ error: "Onbekend account." }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const patch: any = {};
  const str = (v: any, n = 120) => (typeof v === "string" ? v.slice(0, n) : undefined);

  if (str(b.naam) !== undefined) patch.naam = str(b.naam);
  if (user.type === "zakelijk") {
    for (const f of ["bedrijfsnaam", "kvk", "btw", "telefoon", "adres", "postcode", "plaats", "iban", "factuurEmail", "website"]) {
      if (typeof b[f] === "string") patch[f] = String(b[f]).slice(0, 120);
    }
  }
  const updated = updateUser(userId, patch);
  return NextResponse.json({ ok: true, id: updated?.id });
}
