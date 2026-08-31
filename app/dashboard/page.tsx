import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListingsByOwner, getLeadsForOwner, getPaymentsByUser, getPayments, getUser, getListingStats } from "@/lib/db";
import { gradient } from "@/lib/format";
import { euro } from "@/lib/money";
import { ListingActions } from "@/components/ListingActions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/inloggen");

  const user = getUser(userId);
  const groet = user?.type === "zakelijk" && user.bedrijfsnaam ? user.bedrijfsnaam : session!.user?.name?.split(" ")[0];
  const listings = getListingsByOwner(userId);
  const leads = getLeadsForOwner(userId);
  const payments = getPaymentsByUser(userId);
  const openPayments = getPayments().filter((p) => p.userId === userId && p.status === "open");
  const openFor = (listingId: string) => openPayments.find((p) => p.listingId === listingId);

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Hoi {groet} 👋</h1>
      <p className="text-grijs mb-5">
        {user?.type === "zakelijk"
          ? "Beheer al je objecten onder één account. Leads komen rechtstreeks bij je binnen."
          : "Jouw woningen en leads op één plek. Leads komen rechtstreeks bij jou binnen."}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat n={String(listings.filter((l) => l.status === "live").length)} l="Advertenties live" />
        <Stat n={String(leads.length)} l="Leads" />
        <Stat n={String(payments.filter((p) => p.status === "paid").length)} l="Betalingen" />
        <Stat n={euro(payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.bedrag, 0))} l="Uitgegeven" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-bold text-lg">Mijn woningen</h2>
        <Link href="/plaatsen" className="btn btn-ghost text-sm">+ Nieuwe woning</Link>
      </div>

      {listings.length === 0 ? (
        <div className="card text-grijs">Je hebt nog geen woning geplaatst. <Link href="/plaatsen" className="text-bosgroen font-semibold">Plaats je eerste huus →</Link></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {listings.map((l) => (
            <div key={l.id} className="card">
              <div className="flex gap-3 items-center">
                <div className="w-24 h-16 rounded-lg shrink-0 overflow-hidden relative" style={{ background: gradient(l.kleur) }}>
                  {l.fotos && l.fotos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.fotos[0]} alt={l.titel} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold">{l.titel}</div>
                  <div className="text-sm text-grijs">{euro(l.prijs)} · {l.doel === "huur" ? "Te huur" : "Te koop"} · Pakket {l.pakket}</div>
                  <div className="mt-1">
                    {l.status === "live" && <span className="pill">Live</span>}
                    {l.status === "verkocht" && <span className="inline-block bg-oranje text-white font-semibold text-xs px-3 py-1 rounded-full">Verkocht</span>}
                    {l.status === "offline" && <span className="inline-block bg-grijs text-white font-semibold text-xs px-3 py-1 rounded-full">Offline</span>}
                    {l.status === "wacht_op_betaling" && (
                      <span className="inline-flex items-center gap-2 text-sm text-oranje-dk font-semibold">
                        Wacht op betaling
                        {openFor(l.id) && <Link href={`/betaling/${openFor(l.id)!.id}`} className="btn text-xs py-1 px-2">Betaal af</Link>}
                      </span>
                    )}
                  </div>
                </div>
                {l.status === "live" && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <Link href={`/aanbod/${l.id}`} className="btn btn-green text-sm">Bekijk</Link>
                    <Link href={`/promoten/${l.id}`} className="btn text-sm">🚀 Opvallen</Link>
                  </div>
                )}
              </div>
              {(l.status === "live" || l.status === "verkocht") && (() => {
                const s = getListingStats(l.id);
                return (
                  <div className="mt-2 flex gap-3 text-xs text-grijs">
                    <span title="Paginaweergaven">👁️ <strong className="text-inkt">{s.weergaven}</strong> weergaven</span>
                    <span title="Ontvangen leads">✉️ <strong className="text-inkt">{s.leads}</strong> leads</span>
                  </div>
                );
              })()}
              {l.status === "live" && l.uitgelicht && (
                <div className="mt-2 text-xs text-oranje-dk font-semibold">✨ Uitgelicht op de home</div>
              )}
              {(l.status === "live" || l.status === "verkocht" || l.status === "offline") && (
                <div className="mt-3 pt-3 border-t border-lijn flex items-center gap-3 flex-wrap">
                  <Link href={`/dashboard/bewerken/${l.id}`} className="text-sm text-bosgroen font-semibold hover:underline">✏️ Bewerken</Link>
                  <ListingActions id={l.id} status={l.status} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display font-bold text-lg mt-6 mb-2">
        Leads <span className="bg-oranje text-white text-[0.66rem] font-bold px-2 py-0.5 rounded-full font-display align-middle">rechtstreeks naar jou</span>
      </h2>
      {leads.length === 0 ? (
        <div className="card text-grijs text-sm">Nog geen leads. Zodra iemand contact opneemt, verschijnt het hier én in je mailbox.</div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <div key={lead.id} className="card flex gap-3 items-center py-3">
              <div className="w-10 h-10 rounded-full bg-salie-lt flex items-center justify-center font-display font-bold text-bosgroen-dk">
                {lead.naam.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {lead.naam} <span className="text-grijs font-normal">· {lead.datum}</span>
                  {lead.bron === "mantelzorg" && (
                    <span className="ml-2 bg-salie-lt text-bosgroen-dk text-[0.62rem] font-display font-semibold px-2 py-0.5 rounded-full align-middle">Mantelzorg</span>
                  )}
                </div>
                <div className="text-sm text-grijs whitespace-pre-line">{lead.bericht}</div>
              </div>
              <a href={`mailto:${lead.email}`} className="btn text-sm">Beantwoorden</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="card">
      <div className="font-display font-extrabold text-2xl text-bosgroen-dk leading-none">{n}</div>
      <div className="text-sm text-grijs mt-1">{l}</div>
    </div>
  );
}
