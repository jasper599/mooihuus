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
  factuurnummer?: string; // vooraan in de omschrijving, zodat e-Boekhouden de betaling aan de factuur koppelt
  redirectUrl: string;
  webhookUrl: string;
}): Promise<{ mollieId: string; checkoutUrl: string }> {
  // Dynamische import zodat de app zonder key/pakket gewoon bouwt en draait.
  const { default: createMollieClient } = (await import("@mollie/api-client")) as any;
  const client = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY as string });
  const payment = await client.payments.create({
    amount: { currency: "EUR", value: args.bedrag.toFixed(2) },
    description: (args.factuurnummer ? `${args.factuurnummer} · ${args.beschrijving}` : args.beschrijving).slice(0, 255),
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

export async function cancelMolliePayment(mollieId: string): Promise<boolean> {
  try {
    const { default: createMollieClient } = (await import("@mollie/api-client")) as any;
    const client = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY as string });
    const payment = await client.payments.get(mollieId);
    if (payment && payment.isCancelable) {
      await client.payments.cancel(mollieId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Bestaande Mollie-betaling hergebruiken als die nog open staat; anders null.
export async function bruikbareCheckout(mollieId: string): Promise<string | null> {
  try {
    const { default: createMollieClient } = (await import("@mollie/api-client")) as any;
    const client = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY as string });
    const payment = await client.payments.get(mollieId);
    if (payment.status !== "open") return null;
    return payment.getCheckoutUrl() ?? null;
  } catch {
    return null;
  }
}

// Ruwe Mollie-status (open, pending, paid, failed, canceled, expired, ...).
export async function mollieRuweStatus(mollieId: string): Promise<string> {
  const { default: createMollieClient } = (await import("@mollie/api-client")) as any;
  const client = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY as string });
  const payment = await client.payments.get(mollieId);
  return String(payment.status || "");
}

// Is deze factuur definitief afgeboekt (gecrediteerd)? Dan kan er niet meer
// betaald worden. Een mislukte iDEAL-poging telt niet: die mag opnieuw.
export function isGecrediteerd(p: { status: string; methode?: string; factuurnummer: string }, alle: { soort?: string; omschrijving?: string }[]): boolean {
  if (p.status !== "failed") return false;
  if (p.methode === "Gecrediteerd") return true;
  return alle.some((c) => c.soort === "creditnota" && (c.omschrijving || "").includes(p.factuurnummer));
}
