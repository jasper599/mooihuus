import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUser, getPaymentsByUser, getListing } from "@/lib/db";
import { euroCents } from "@/lib/money";
import { WachtwoordWijzigen } from "@/components/WachtwoordWijzigen";

export const dynamic = "force-dynamic";

export default async function Account() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/inloggen");
  const user = getUser(userId)!;
  const payments = getPaymentsByUser(userId);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Mijn account</h1>
      <p className="text-grijs mb-5">Je gegevens en betalingen.</p>

      <div className="card mb-5">
        <Row k="Accounttype" v={user.type === "zakelijk" ? "Zakelijk" : "Particulier"} />
        {user.type === "zakelijk" && user.bedrijfsnaam && <Row k="Bedrijfsnaam" v={user.bedrijfsnaam} />}
        {user.type === "zakelijk" && user.kvk && <Row k="KvK" v={user.kvk} />}
        <Row k={user.type === "zakelijk" ? "Contactpersoon" : "Naam"} v={user.naam} />
        <Row k="E-mail" v={user.email} />
        <Row k="Rol" v={user.rol === "beheerder" ? "Beheerder" : "Eigenaar"} />
        <Row k="Lid sinds" v={new Date(user.aangemaakt).toLocaleDateString("nl-NL")} />
      </div>

      <h2 className="font-display font-bold text-lg mb-2">Betalingen & bewijzen</h2>
      {payments.length === 0 ? (
        <div className="card text-grijs text-sm">Nog geen betalingen.</div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-bosgroen text-white text-left">
                <th className="px-3.5 py-2.5 font-display">Factuur</th>
                <th className="px-3.5 py-2.5 font-display">Woning</th>
                <th className="px-3.5 py-2.5 font-display">Pakket</th>
                <th className="px-3.5 py-2.5 font-display">Bedrag</th>
                <th className="px-3.5 py-2.5 font-display">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-lijn">
                  <td className="px-3.5 py-2.5">
                    <Link href={`/factuur/${p.id}`} className="text-bosgroen font-semibold hover:underline">{p.factuurnummer}</Link>
                  </td>
                  <td className="px-3.5 py-2.5">{getListing(p.listingId)?.titel ?? "—"}</td>
                  <td className="px-3.5 py-2.5">{p.pakket}</td>
                  <td className="px-3.5 py-2.5">{euroCents(p.bedrag)}</td>
                  <td className="px-3.5 py-2.5">
                    {p.status === "paid" ? (
                      <span className="text-bosgroen font-semibold">Betaald ✓</span>
                    ) : (
                      <span className="text-oranje-dk font-semibold">Open</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-grijs mt-2">Klik op een factuurnummer om je factuur te bekijken, te downloaden of te printen (PDF). Je ontvangt ook per e-mail een betalingsbewijs.</p>

      <h2 className="font-display font-bold text-lg mt-8 mb-2">Wachtwoord wijzigen</h2>
      <div className="card">
        <WachtwoordWijzigen />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-lijn last:border-none">
      <span className="text-grijs text-sm">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
