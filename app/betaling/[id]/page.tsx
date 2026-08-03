import { notFound } from "next/navigation";
import Link from "next/link";
import { getPayment, getListing } from "@/lib/db";
import { euroCents } from "@/lib/money";
import { mollieEnabled, getMollieStatus } from "@/lib/mollie";
import { markPaymentPaid } from "@/lib/payments";
import { CheckoutButton } from "./CheckoutButton";

export const dynamic = "force-dynamic";

export default async function BetalingPage({ params }: { params: { id: string } }) {
  let payment = getPayment(params.id);
  if (!payment) return notFound();

  // Terug van Mollie: controleer de status.
  if (payment.status === "open" && mollieEnabled() && payment.mollieId) {
    const st = await getMollieStatus(payment.mollieId);
    if (st === "paid") {
      await markPaymentPaid(payment.id, "iDEAL");
      payment = getPayment(params.id)!;
    }
  }

  const listing = getListing(payment.listingId);
  const isOpvaller = payment.soort === "opvaller";

  if (payment.status === "paid") {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="text-5xl mb-3">{isOpvaller ? "🚀" : "✅"}</div>
        <h1 className="font-display font-extrabold text-2xl text-bosgroen-dk">
          {isOpvaller ? "Betaald — je opvaller staat aan!" : "Betaald — je huus staat online!"}
        </h1>
        <p className="text-grijs mt-2">
          We hebben een betalingsbewijs ({payment.factuurnummer}) naar je e-mail gestuurd.{" "}
          {isOpvaller ? (
            <>De opvaller <strong>“{payment.omschrijving}”</strong> is geactiveerd voor <strong>“{listing?.titel}”</strong>.</>
          ) : (
            <>Je advertentie <strong>“{listing?.titel}”</strong> is nu live.</>
          )}
        </p>
        <div className="mt-5 flex gap-3 justify-center">
          <Link href="/dashboard" className="btn">Naar mijn dashboard</Link>
          {listing && <Link href={`/aanbod/${listing.id}`} className="btn btn-ghost">Bekijk advertentie</Link>}
        </div>
      </div>
    );
  }

  // Open: interne iDEAL-simulatie (of instructie voor Mollie).
  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-grijs mb-1">
            <span className="w-2 h-2 rounded-full bg-oranje" /> Betaalomgeving
          </div>
          <h1 className="font-display font-extrabold text-2xl text-bosgroen-dk">Betaal met iDEAL</h1>
          <p className="text-grijs text-sm mt-1">
            {isOpvaller ? <>Opvaller {payment.omschrijving} · {listing?.titel}</> : <>Advertentie: {listing?.titel}</>}
          </p>
        </div>

        <div className="bg-creme border border-lijn rounded-xl p-4 my-4">
          {isOpvaller ? (
            <div className="flex justify-between text-sm py-1"><span>Opvaller {payment.omschrijving}</span><span>{euroCents(payment.bedrag)}</span></div>
          ) : payment.kortingPct ? (
            <>
              <div className="flex justify-between text-sm py-1"><span>Pakket {payment.pakket}</span><span>{euroCents(payment.bedrag / (1 - payment.kortingPct / 100))}</span></div>
              <div className="flex justify-between text-sm py-1 text-oranje-dk font-semibold"><span>Volumekorting −{payment.kortingPct}%</span><span>−{euroCents(payment.bedrag / (1 - payment.kortingPct / 100) - payment.bedrag)}</span></div>
            </>
          ) : (
            <div className="flex justify-between text-sm py-1"><span>Pakket {payment.pakket}</span><span>{euroCents(payment.bedrag)}</span></div>
          )}
          <div className="flex justify-between text-sm py-1 text-grijs"><span>waarvan 21% btw</span><span>{euroCents(payment.bedrag - payment.bedrag / 1.21)}</span></div>
          <div className="flex justify-between font-display font-bold text-bosgroen-dk pt-2 mt-1 border-t border-lijn"><span>Totaal</span><span>{euroCents(payment.bedrag)}</span></div>
        </div>

        <CheckoutButton paymentId={payment.id} bedrag={euroCents(payment.bedrag)} />
        <p className="text-xs text-grijs mt-3 text-center">
          {mollieEnabled()
            ? "Je wordt doorgestuurd naar de beveiligde Mollie iDEAL-omgeving."
            : "Simulatie — er is geen Mollie-key ingesteld. In productie loopt dit via Mollie iDEAL."}
        </p>
      </div>
    </div>
  );
}
