import { NextResponse } from "next/server";
import { getPayments, updatePayment } from "@/lib/db";
import { getMollieStatus } from "@/lib/mollie";
import { markPaymentPaid } from "@/lib/payments";
import { guusBeltJasperOpAchtergrond } from "@/lib/guus-bel";

function euroKort(n: number): string {
  return "€" + (Math.round((n || 0) * 100) / 100).toLocaleString("nl-NL");
}

// Echte Mollie-webhook. Mollie POST't hier het payment-id na een statuswijziging.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const mollieId = String(form.get("id") || "");
    if (!mollieId) return NextResponse.json({ ok: true });

    const payment = getPayments().find((p) => p.mollieId === mollieId);
    if (!payment) return NextResponse.json({ ok: true });

    const status = await getMollieStatus(mollieId);
    if (status === "paid") {
      await markPaymentPaid(payment.id, "iDEAL");
    } else if (status === "failed" && payment.status !== "failed" && payment.status !== "paid") {
      // Echt mislukte betaling (geen afgebroken/verlopen) — vastleggen en Guus
      // belt Jasper even dat er mogelijk iets misgaat met betalen op de site.
      updatePayment(payment.id, { status: "failed" });
      const wat = payment.omschrijving || payment.soort || "een betaling";
      guusBeltJasperOpAchtergrond(
        `Hoi Jasper, met Guus. Let op: er is net een betaling mislukt — ${wat} van ${euroKort(payment.bedrag)}. Misschien goed om even te checken of er iets misgaat met betalen op de site.`
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
