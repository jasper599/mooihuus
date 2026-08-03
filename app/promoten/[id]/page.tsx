import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing } from "@/lib/db";
import { OPVALLERS, euroCents } from "@/lib/money";
import { gradient } from "@/lib/format";
import { PromoteButtons } from "./PromoteButtons";

export const dynamic = "force-dynamic";

export default async function PromotenPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/inloggen");

  const listing = getListing(params.id);
  if (!listing) return notFound();
  if (listing.ownerId !== userId) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-grijs hover:text-bosgroen">← Terug naar dashboard</Link>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk mt-2">Laat je huus opvallen 🚀</h1>
      <p className="text-grijs mb-5">
        Geef je advertentie een zetje: hoger in de lijst, opvallende opmaak of een plek op onze socials.
        Je betaalt eenmalig per opvaller, veilig via iDEAL.
      </p>

      <div className="card flex gap-3 items-center mb-5">
        <div className="w-24 h-16 rounded-lg shrink-0" style={{ background: gradient(listing.kleur) }} />
        <div>
          <div className="font-display font-bold">{listing.titel}</div>
          <div className="text-sm text-grijs">Pakket {listing.pakket} · {listing.provincie}</div>
          {listing.uitgelicht && <div className="text-xs text-oranje-dk font-semibold mt-1">✨ Nu uitgelicht op de home</div>}
        </div>
      </div>

      {listing.status !== "live" ? (
        <div className="card text-grijs">
          Je kunt alleen een opvaller kopen voor een advertentie die online staat. Zet je advertentie
          eerst live via je <Link href="/dashboard" className="text-bosgroen font-semibold">dashboard</Link>.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {OPVALLERS.map((o) => (
            <div key={o.id} className="card flex flex-col">
              <div className="flex items-baseline justify-between">
                <div className="font-display font-bold text-bosgroen-dk">{o.naam}</div>
                <div className="font-display font-extrabold text-lg text-bosgroen-dk">{euroCents(o.prijs)}</div>
              </div>
              <p className="text-sm text-grijs mt-1 flex-1">{o.omschrijving}</p>
              <div className="mt-3">
                <PromoteButtons listingId={listing.id} opvaller={o.id} prijs={euroCents(o.prijs)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-grijs mt-5">
        Alle bedragen zijn inclusief 21% btw. Opvallers werken direct na betaling. Social spotlight
        wordt binnen enkele werkdagen door ons geplaatst.
      </p>
    </div>
  );
}
