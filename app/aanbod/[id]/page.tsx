
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing, getUser } from "@/lib/db";
import { gradient, euro, prijsSuffix, grondInfo, embedVideoUrl, openhuisInfo } from "@/lib/format";
import { getLocale } from "@/lib/i18n-server";
import { t, localeHref } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { suggestUitjes } from "@/lib/uitjes";
import { LeadForm } from "./LeadForm";
import { ShareButtons } from "@/components/ShareButtons";
import { FavButton } from "@/components/FavButton";
import { BezichtigingForm } from "@/components/BezichtigingForm";
import { MaandlastenCalculator } from "@/components/MaandlastenCalculator";
import { VertaalOmschrijving } from "@/components/VertaalOmschrijving";
import { FotoGalerij } from "@/components/FotoGalerij";
 
export const dynamic = "force-dynamic";
 
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const l = getListing(params.id);
  if (!l) return { title: "Woning niet gevonden" };
  const soort = l.doel === "huur" ? "te huur" : "te koop";
  const title = `${l.titel} — ${l.type} ${soort} in ${l.provincie}`;
  const description = `${l.type} ${soort} in ${l.provincie} (${l.park}), voor ${l.personen} personen, ${l.m2} m². ${euro(l.prijs)}. ${l.omschrijving}`.slice(0, 300);
  return {
    title,
    description,
    alternates: { canonical: `/aanbod/${l.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${COMPANY.website}/aanbod/${l.id}`,
      images: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined,
    },
  };
}
 
export default function ListingDetail({ params }: { params: { id: string } }) {
  const listing = getListing(params.id);
  if (!listing) return notFound();
  const locale = getLocale();
  const owner = getUser(listing.ownerId);
  const zakelijk = owner?.type === "zakelijk";
  const aanbieder = zakelijk ? owner?.bedrijfsnaam || owner?.naam : undefined;
 
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.titel,
    description: listing.omschrijving,
    category: listing.type,
    offers: {
      "@type": "Offer",
      price: listing.prijs,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${COMPANY.website}/aanbod/${listing.id}`,
    },
  };
 
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href={localeHref(locale, "/")} className="text-sm text-bosgroen hover:underline">{t(locale, "listing.back")}</Link>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] mt-3">
        <div>
          <FotoGalerij fotos={listing.fotos ?? []} titel={listing.titel} bg={gradient(listing.kleur)}>
            <span className={`absolute top-3 left-3 text-white font-display font-semibold text-xs px-3 py-1 rounded-full ${listing.status === "verkocht" ? "bg-oranje" : "bg-bosgroen"}`}>
              {listing.status === "verkocht" ? "Verkocht" : listing.doel === "huur" ? t(locale, "home.huur") : t(locale, "home.koop")}
            </span>
            {grondInfo(listing.grond) && (
              <span
                className={`absolute bottom-3 left-3 text-white font-display font-semibold text-xs px-3 py-1 rounded-full ${
                  grondInfo(listing.grond)!.eigen ? "bg-bosgroen-dk" : "bg-inkt/85"
                }`}
              >
                {grondInfo(listing.grond)!.eigen ? "🌳 Eigen grond" : `🔑 ${grondInfo(listing.grond)!.label}`}
              </span>
            )}
          </FotoGalerij>
          <h1 className="font-display font-extrabold text-2xl text-bosgroen-dk mt-4">{listing.titel}</h1>
          <div className="text-grijs">{listing.type} · {listing.park} · {listing.provincie}</div>
          {aanbieder && (
            <div className="text-sm text-grijs mt-1">
              {t(locale, "listing.aangebodenDoor")} <span className="font-semibold text-bosgroen-dk">{aanbieder}</span>
            </div>
          )}
          <div className="flex gap-2 flex-wrap mt-3">
            <span className="pill">{listing.personen} {t(locale, "listing.persons")}</span>
            <span className="pill">{listing.m2} m²</span>
            <span className="pill">{listing.type}</span>
          </div>
          {(() => {
            const oh = openhuisInfo(listing);
            if (!oh || !oh.aankomend) return null;
            return (
              <div className="mt-4 rounded-2xl bg-oranje text-white p-4 flex items-center gap-3 flex-wrap">
                <div className="text-3xl">🏠</div>
                <div>
                  <div className="font-display font-extrabold text-lg">Open huis — {oh.label}</div>
                  <div className="text-sm text-white/90">{oh.van && oh.tot ? `Loop binnen tussen ${oh.van} en ${oh.tot} uur.` : "Loop gerust binnen."} Je bent welkom — meld je even aan via het contactformulier.</div>
                </div>
              </div>
            );
          })()}
 
          <VertaalOmschrijving text={listing.omschrijving} />
 
          {(() => {
            const embed = embedVideoUrl(listing.videoUrl);
            if (!embed) return null;
            return (
              <div className="mt-6">
                <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-2">🎬 Video & rondleiding</h2>
                <div className="relative w-full rounded-2xl overflow-hidden border border-lijn" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    src={embed}
                    title={`Rondleiding ${listing.titel}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; xr-spatial-tracking"
                    allowFullScreen
                  />
                </div>
              </div>
            );
          })()}
 
          {(() => {
            const rows: [string, string][] = [];
            rows.push(["Type", listing.type]);
            if (listing.bouwjaar) rows.push(["Bouwjaar", String(listing.bouwjaar)]);
            rows.push(["Woonoppervlakte", `${listing.m2} m²`]);
            if (listing.perceel) rows.push(["Perceel", `${listing.perceel} m²`]);
            if (listing.slaapkamers) rows.push(["Slaapkamers", String(listing.slaapkamers)]);
            rows.push(["Max. personen", String(listing.personen)]);
            if (listing.grond) rows.push(["Grond", listing.grond]);
            if (listing.energielabel) rows.push(["Energielabel", listing.energielabel]);
            if (listing.kosten) rows.push(["Kosten", listing.kosten]);
            rows.push(["Aangeboden als", listing.doel === "huur" ? "Te huur" : "Te koop"]);
            return (
              <div className="mt-6">
                <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-2">Kenmerken</h2>
                <dl className="bg-white border border-lijn rounded-2xl overflow-hidden">
                  {rows.map(([k, v], i) => (
                    <div key={k} className={`flex justify-between gap-4 px-4 py-2.5 text-sm ${i % 2 ? "bg-creme" : ""}`}>
                      <dt className="text-grijs">{k}</dt>
                      <dd className="font-semibold text-inkt text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })()}
          {(() => {
            const uitjes = listing.uitjes && listing.uitjes.length > 0 ? listing.uitjes : suggestUitjes(listing.provincie);
            return (
              <div className="mt-6">
                <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-2">{t(locale, "listing.uitjes")}</h2>
                <div className="flex flex-wrap gap-2">
                  {uitjes.map((u) => (
                    <span key={u} className="pill">📍 {u}</span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
 
        <aside>
          <div className="card">
            <div className="font-display font-extrabold text-2xl text-oranje-dk">
              {euro(listing.prijs)}
              {prijsSuffix(listing) && <span className="text-grijs font-semibold text-base ml-1.5">{prijsSuffix(listing)}</span>}
            </div>
            <div className="text-sm font-semibold mb-1 mt-3">{t(locale, zakelijk ? "listing.contactZakelijk" : "listing.contactTitle")}</div>
            <p className="text-xs text-grijs mb-3">{t(locale, zakelijk ? "listing.directZakelijk" : "listing.direct")}</p>
            <LeadForm listingId={listing.id} zakelijk={zakelijk} />
            {listing.doel !== "huur" && (
              <div className="mt-3 pt-3 border-t border-lijn">
                <BezichtigingForm listingId={listing.id} />
              </div>
            )}
          </div>
          <div className="card mt-4 flex flex-col gap-3">
            <FavButton id={listing.id} variant="inline" />
            <ShareButtons title={listing.titel} />
          </div>
          {listing.doel !== "huur" && <MaandlastenCalculator prijs={listing.prijs} />}
        </aside>
      </div>
    </div>
  );
}
 

