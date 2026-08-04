import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { ListingsBrowser } from "@/components/ListingsBrowser";
import { getLocale } from "@/lib/i18n-server";
import { t, localeHref } from "@/lib/i18n";
import { markeerHuidigeBlogAlsBasis, stuurNieuwsteBlog } from "@/lib/nieuwsbrief";

export const dynamic = "force-dynamic";

export default function Home() {
  // Nieuwsbrief: eerste keer een basislijn zetten (geen oude artikelen sturen),
  // daarna gaat een nieuw blogartikel automatisch naar de inschrijvers.
  markeerHuidigeBlogAlsBasis();
  stuurNieuwsteBlog().catch(() => {});

  // Alleen de eerste foto meesturen naar de overzichtskaarten (de kaart toont
  // er maar één) — scheelt fors in paginagrootte bij 150+ woningen.
  const listings = getLiveListings().map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined }));
  const locale = getLocale();

  return (
    <div>
      <section className="bg-bosgroen text-white rounded-2xl p-7 md:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="font-display font-semibold text-salie-lt text-sm mb-2">{t(locale, "home.tagline")}</div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">{t(locale, "home.title")}</h1>
          <p className="text-[#DDECE0] mt-3">{t(locale, "home.sub")}</p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <Link href={localeHref(locale, "/plaatsen")} className="btn">{t(locale, "home.ctaPlace")}</Link>
            <a href="#aanbod" className="btn btn-ghost text-[#EAF3EC]">{t(locale, "home.ctaBrowse")}</a>
            <Link href={localeHref(locale, "/zoeker")} className="btn btn-ghost text-[#EAF3EC]">🔔 {t(locale, "nav.zoeker")}</Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-salie/25" />
      </section>

      <ListingsBrowser listings={listings} locale={locale} />
    </div>
  );
}
