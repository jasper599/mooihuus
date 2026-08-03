import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPayment, getListing, getUser } from "@/lib/db";
import { euroCents } from "@/lib/money";
import { COMPANY } from "@/lib/company";
import { Wordmark } from "@/components/Wordmark";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function Factuur({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol;
  if (!userId) redirect("/inloggen");

  const payment = getPayment(params.id);
  if (!payment) return notFound();
  if (payment.userId !== userId && rol !== "beheerder") redirect("/account");

  const listing = getListing(payment.listingId);
  const klant = getUser(payment.userId);
  const exBtw = payment.bedrag / 1.21;
  const btw = payment.bedrag - exBtw;
  const basisIncl = payment.kortingPct ? payment.bedrag / (1 - payment.kortingPct / 100) : payment.bedrag;
  const datum = payment.betaaldOp ?? payment.aangemaakt;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4 no-print">
        <Link href="/account" className="text-sm text-bosgroen hover:underline">← Naar mijn account</Link>
        <PrintButton />
      </div>

      <div className="card">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <Wordmark className="text-xl" />
            <div className="text-xs text-grijs mt-2">
              {COMPANY.bv}<br />
              {COMPANY.adres}<br />
              {COMPANY.postcode}<br />
              KvK {COMPANY.kvk} · btw {COMPANY.btw}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display font-extrabold text-xl text-bosgroen-dk">Factuur</div>
            <div className="text-sm">{payment.factuurnummer}</div>
            <div className="text-xs text-grijs mt-1">Factuurdatum: {new Date(datum).toLocaleDateString("nl-NL")}</div>
            <div className="text-xs text-grijs">Status: {payment.status === "paid" ? "Betaald" : "Open"}</div>
          </div>
        </div>

        <div className="mt-6 text-sm">
          <div className="text-grijs mb-1">Factuur aan</div>
          <div className="font-semibold">
            {klant?.type === "zakelijk" && klant.bedrijfsnaam ? klant.bedrijfsnaam : klant?.naam}
          </div>
          {klant?.type === "zakelijk" && klant.bedrijfsnaam && <div>t.a.v. {klant.naam}</div>}
          <div className="text-grijs">{klant?.email}</div>
          {klant?.kvk && <div className="text-grijs">KvK {klant.kvk}</div>}
        </div>

        <table className="w-full text-sm mt-6 border-t border-lijn">
          <thead>
            <tr className="text-left text-grijs">
              <th className="py-2">Omschrijving</th>
              <th className="py-2 text-right">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-lijn">
              <td className="py-2">
                {payment.soort === "opvaller"
                  ? `Opvaller ${payment.omschrijving}${listing ? ` — ${listing.titel}` : ""}`
                  : `Advertentiepakket ${payment.pakket}${listing ? ` — ${listing.titel}` : ""}`}
              </td>
              <td className="py-2 text-right">{euroCents(basisIncl / 1.21)}</td>
            </tr>
            {payment.kortingPct ? (
              <tr className="border-t border-lijn text-oranje-dk">
                <td className="py-2">Volumekorting −{payment.kortingPct}%</td>
                <td className="py-2 text-right">−{euroCents((basisIncl - payment.bedrag) / 1.21)}</td>
              </tr>
            ) : null}
            <tr className="border-t border-lijn">
              <td className="py-2 text-grijs">Subtotaal (excl. btw)</td>
              <td className="py-2 text-right">{euroCents(exBtw)}</td>
            </tr>
            <tr className="border-t border-lijn">
              <td className="py-2 text-grijs">Btw 21%</td>
              <td className="py-2 text-right">{euroCents(btw)}</td>
            </tr>
            <tr className="border-t-2 border-bosgroen font-display font-bold text-bosgroen-dk">
              <td className="py-2">Totaal (incl. btw)</td>
              <td className="py-2 text-right">{euroCents(payment.bedrag)}</td>
            </tr>
          </tbody>
        </table>

        <div className="text-xs text-grijs mt-6">
          Betaalmethode: {payment.methode}. {payment.status === "paid" ? "Dit bedrag is voldaan; deze factuur dient als betalingsbewijs." : "Nog te voldoen."} Vragen? Mail {COMPANY.email}.
        </div>
      </div>
    </div>
  );
}
