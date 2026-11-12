import { NextResponse } from "next/server";
import { markPaymentPaid } from "@/lib/payments";
import { getPayment, getPayments, updatePayment } from "@/lib/db";
import { mollieEnabled, createMolliePayment, bruikbareCheckout, getMollieStatus, isGecrediteerd } from "@/lib/mollie";

// Start de betaling van een open factuur.
// - Met Mollie: maakt op het moment van klikken een verse iDEAL-betaling (een
//   iDEAL-link verloopt na ongeveer 15 minuten, dus nooit een oude link uit de
//   mail gebruiken) en geeft de checkout-url terug.
// - Zonder Mollie-key (lokaal/proef): simulatie, markeert als betaald.
function baseUrl(req: Request): string {
  return process.env.NEXTAUTH_URL || new URL(req.url).origin;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const payment = getPayment(params.id);
  if (!payment) return NextResponse.json({ error: "Betaling niet gevonden" }, { status: 404 });
  if (payment.status === "paid") return NextResponse.json({ ok: true, betaald: true });
  if (isGecrediteerd(payment, getPayments())) {
    return NextResponse.json({ error: "Deze factuur is vervallen of gecrediteerd. Neem contact op met info@mooihuus.nl." }, { status: 409 });
  }

  if (!mollieEnabled()) {
    await markPaymentPaid(params.id, "iDEAL (simulatie)");
    return NextResponse.json({ ok: true, betaald: true });
  }

  try {
    if (payment.mollieId) {
      if ((await getMollieStatus(payment.mollieId)) === "paid") {
        await markPaymentPaid(payment.id, "iDEAL");
        return NextResponse.json({ ok: true, betaald: true });
      }
      const bestaand = await bruikbareCheckout(payment.mollieId);
      if (bestaand) return NextResponse.json({ ok: true, checkoutUrl: bestaand });
    }
    const { mollieId, checkoutUrl } = await createMolliePayment({
      factuurnummer: payment.factuurnummer,
      bedrag: payment.bedrag,
      beschrijving: payment.omschrijving || "Mooihuus",
      redirectUrl: `${baseUrl(req)}/betaling/${payment.id}`,
      webhookUrl: `${baseUrl(req)}/api/webhook/mollie`,
    });
    updatePayment(payment.id, { mollieId });
    if (!checkoutUrl) throw new Error("geen checkout-url");
    return NextResponse.json({ ok: true, checkoutUrl });
  } catch (e) {
    console.error("[betaling] Mollie-checkout mislukt", payment.id, e);
    return NextResponse.json({ error: "Betalen lukt even niet. Probeer het over een paar minuten opnieuw." }, { status: 502 });
  }
}
