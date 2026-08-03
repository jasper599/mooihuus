import { Payment } from "./types";

// ------------------------------------------------------------------
// Betaling via Mollie (iDEAL).
// - Met MOLLIE_API_KEY: echte Mollie-betaling; gebruiker gaat naar de
//   Mollie-checkout, status komt binnen via de webhook.
// - Zonder key: simulatie — de app toont een eigen "iDEAL"-scherm en
//   markeert de betaling als betaald. Zo werkt de flow overal.
// ------------------------------------------------------------------

export function mollieEnabled(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY);
}

export async function createMolliePayment(args: {
  bedrag: number;
  beschrijving: string;
  redirectUrl: string;
  webhookUrl: string;
}): Promise<{ mollieId: string; checkoutUrl: string }> {
  // Dynamische import zodat de app zonder key/pakket gewoon bouwt en draait.
  const { default: createMollieClient } = (await import("@mollie/api-client")) as any;
  const client = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY as string });
  const payment = await client.payments.create({
    amount: { currency: "EUR", value: args.bedrag.toFixed(2) },
    description: args.beschrijving,
    redirectUrl: args.redirectUrl,
    webhookUrl: args.webhookUrl,
    method: "ideal",
  });
  return { mollieId: payment.id, checkoutUrl: payment.getCheckoutUrl() ?? "" };
}

export async function getMollieStatus(mollieId: string): Promise<Payment["status"]> {
  const { default: createMollieClient } = (await import("@mollie/api-client")) as any;
  const client = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY as string });
  const payment = await client.payments.get(mollieId);
  if (payment.status === "paid") return "paid";
  if (["failed", "canceled", "expired"].includes(payment.status)) return "failed";
  return "open";
}
