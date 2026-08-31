import type { Metadata } from "next";
import { getLiveListings } from "@/lib/db";
import { ListingsBrowser } from "@/components/ListingsBrowser";
import { HuurPartners } from "@/components/HuurPartners";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Huusje Huren — vakantiewoningen te huur op de mooiste parken | Mooihuus",
  description:
    "Even er tussenuit? Huur een recreatiewoning, chalet of lodge op de mooiste vakantieparken van Nederland. Filter op provincie, type, prijs per nacht en aantal personen.",
  alternates: { canonical: "/verhuur" },
};

export default function VerhuurPage() {
  // De huurfeeds worden op de achtergrond ververst door de scheduler (elke ~6u),
  // niet op deze pagina — zo blijft de pagina licht en snel.
  const listings = getLiveListings()
    .filter((l) => l.doel === "huur")
    // Alleen de eerste foto en géén (lange) omschrijving meesturen — scheelt
    // fors in paginagrootte bij duizenden woningen.
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined, omschrijving: "" }));
  const locale = getLocale();

  return (
    <div>
      <section className="bg-bosgroen text-white rounded-2xl p-7 md:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="font-display font-semibold text-salie-lt text-sm mb-2">⛱️ Even weg in een mooi huus</div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">Huusje Huren</h1>
          <p className="text-[#DDECE0] mt-3">
            Er even tussenuit? Huur een recreatiewoning, chalet of lodge op de mooiste vakantieparken van Nederland.
            Al het aanbod hieronder komt van onze verhuurpartners — je boekt rechtstreeks bij hen.
          </p>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-salie/25" />
      </section>

      <ListingsBrowser listings={listings} locale={locale} modus="huur" />

      <HuurPartners locale={locale} />
    </div>
  );
}
