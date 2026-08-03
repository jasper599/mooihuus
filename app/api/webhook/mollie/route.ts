import { NextResponse } from "next/server";
import { getPayments } from "@/lib/db";
import { getMollieStatus } from "@/lib/mollie";
import { markPaymentPaid } from "@/lib/payments";

// Echte Mollie-webhook. Mollie POST't hier het payment-id na een statuswijziging.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const mollieId = String(form.get("id") || "");
    if (!mollieId) return NextResponse.json({ ok: true });

    const payment = getPayments().find((p) => p.mollieId === mollieId);
    if (!payment) return NextResponse.json({ ok: true });

    const status = await getMollieStatus(mollieId);
    if (status === "paid") await markPaymentPaid(payment.id, "iDEAL");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
