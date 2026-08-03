import Link from "next/link";
import { Listing } from "@/lib/types";
import { gradient, euro, prijsSuffix, grondInfo } from "@/lib/format";
import { Locale, t, localeHref } from "@/lib/i18n";
import { FavButton } from "./FavButton";

export function ListingCard({ listing, locale = "nl" }: { listing: Listing; locale?: Locale }) {
  return (
    <Link
      href={localeHref(locale, `/aanbod/${listing.id}`)}
      className={`block bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-shadow ${
        listing.uitgelicht ? "border-oranje ring-1 ring-oranje/40" : "border-lijn"
      }`}
    >
      <div className="h-40 relative overflow-hidden" style={{ background: gradient(listing.kleur) }}>
        {listing.fotos && listing.fotos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.fotos[0]} alt={listing.titel} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <span className="absolute top-2.5 left-2.5 bg-bosgroen text-white font-display font-semibold text-[0.68rem] px-2.5 py-0.5 rounded-full">
          {listing.doel === "huur" ? t(locale, "home.huur") : t(locale, "home.koop")}
        </span>
        {listing.uitgelicht && (
          <span className="absolute top-10 left-2.5 bg-oranje text-white font-display font-semibold text-[0.68rem] px-2.5 py-0.5 rounded-full">
            ✨ Uitgelicht
          </span>
        )}
        <FavButton id={listing.id} />
        {grondInfo(listing.grond) && (
          <span
            className={`absolute bottom-2.5 left-2.5 font-display font-semibold text-[0.66rem] px-2.5 py-0.5 rounded-full text-white ${
              grondInfo(listing.grond)!.eigen ? "bg-bosgroen-dk" : "bg-inkt/80"
            }`}
          >
            {grondInfo(listing.grond)!.eigen ? "🌳 Eigen grond" : `🔑 ${grondInfo(listing.grond)!.label}`}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="font-display font-bold text-inkt">{listing.titel}</div>
        <div className="text-sm text-grijs">
          {listing.type} · {listing.personen} {t(locale, "listing.persons")} · {listing.m2} m² · {listing.provincie}
        </div>
        <div className="font-display font-extrabold text-oranje-dk mt-1.5">
          {euro(listing.prijs)}
          {prijsSuffix(listing) && <span className="text-grijs font-semibold text-sm ml-1">{prijsSuffix(listing)}</span>}
        </div>
      </div>
    </Link>
  );
}
