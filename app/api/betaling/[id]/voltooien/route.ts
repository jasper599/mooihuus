import { NextResponse } from "next/server";
import { markPaymentPaid } from "@/lib/payments";
import { getPayment } from "@/lib/db";

// Simulatie-afronding (gebruikt wanneer er geen echte Mollie-key is).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const payment = getPayment(params.id);
  if (!payment) return NextResponse.json({ error: "Betaling niet gevonden" }, { status: 404 });
  await markPaymentPaid(params.id, "iDEAL (simulatie)");
  return NextResponse.json({ ok: true });
}
