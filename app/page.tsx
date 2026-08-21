import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { ListingsBrowser } from "@/components/ListingsBrowser";
import { getLocale } from "@/lib/i18n-server";
import { t, localeHref } from "@/lib/i18n";
import { markeerHuidigeBlogAlsBasis, stuurNieuwsteBlog } from "@/lib/nieuwsbrief";
import { markeerHuidigeMaandAlsBasis, stuurMaandrapportenIndienNieuweMaand } from "@/lib/maandrapport";

export const dynamic = "force-dynamic";

export default function Home() {
  // Nieuwsbrief: eerste keer een basislijn zetten (geen oude artikelen sturen),
  // daarna gaat een nieuw blogartikel automatisch naar de inschrijvers.
  markeerHuidigeBlogAlsBasis();
  stuurNieuwsteBlog().catch(() => {});
  // Maandrapport: automatisch één keer per maand naar alle makelaars.
  markeerHuidigeMaandAlsBasis();
  stuurMaandrapportenIndienNieuweMaand().catch(() => {});

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

      <section className="mt-8">
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk text-center">{t(locale, "usp.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-5">
          {[
            { e: "💶", t: "usp.1t", d: "usp.1d" },
            { e: "📩", t: "usp.2t", d: "usp.2d" },
            { e: "🌲", t: "usp.3t", d: "usp.3d" },
            { e: "🤝", t: "usp.4t", d: "usp.4d" },
            { e: "🧰", t: "usp.5t", d: "usp.5d" },
            { e: "🔔", t: "usp.6t", d: "usp.6d" },
          ].map((u) => (
            <div key={u.t} className="card flex gap-3 items-start">
              <div className="w-11 h-11 rounded-xl bg-salie-lt flex items-center justify-center text-xl shrink-0">{u.e}</div>
              <div>
                <div className="font-display font-bold text-bosgroen-dk">{t(locale, u.t)}</div>
                <div className="text-sm text-grijs mt-0.5">{t(locale, u.d)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link
        href={localeHref(locale, "/fotografie")}
        className="mt-8 block rounded-2xl bg-creme border border-salie p-5 sm:p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex gap-4 items-center flex-wrap">
          <div className="text-3xl">📸</div>
          <div className="flex-1 min-w-[220px]">
            <div className="font-display font-bold text-bosgroen-dk">{t(locale, "foto.homeTitel")}</div>
            <div className="text-sm text-grijs">{t(locale, "foto.homeSub")}</div>
          </div>
          <span className="btn btn-green text-sm">{t(locale, "foto.homeCta")} →</span>
        </div>
      </Link>

      <ListingsBrowser listings={listings} locale={locale} />
    </div>
  );
}
