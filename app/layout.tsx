import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Wordmark } from "@/components/Wordmark";
import { Providers } from "@/components/Providers";
import { CookieBanner } from "@/components/CookieBanner";
import { ChatWidget } from "@/components/ChatWidget";
import { Analytics } from "@/components/Analytics";
import { GoogleTag } from "@/components/GoogleTag";
import { NieuwsbriefForm } from "@/components/NieuwsbriefForm";
import { ServiceWorker } from "@/components/ServiceWorker";
import { InstallPrompt } from "@/components/InstallPrompt";
import { I18nProvider } from "@/components/I18nProvider";
import { getLocale, getPathname } from "@/lib/i18n-server";
import { t, localeHref } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { huidigeSite } from "@/lib/site-server";
import { MOOIHUUS_URL, WOONHUUS_URL } from "@/lib/site";
import { WoonhuusNav } from "@/components/WoonhuusNav";
export const viewport = {
  themeColor: "#2C6B45",
};
export async function generateMetadata(): Promise<Metadata> {
  if (huidigeSite() === "woonhuus") {
    const path = getPathname();
    const title = "Woonhuus.nl: koopwoningen van makelaars en particulieren";
    const description = "Eengezinswoningen, appartementen en starterswoningen te koop in heel Nederland, aangeboden door makelaars en particulieren. Een platform van Mooihuus.";
    return {
      metadataBase: new URL(WOONHUUS_URL),
      title: { default: title, template: "%s · Woonhuus" },
      description,
      applicationName: "Woonhuus",
      manifest: "/manifest.webmanifest",
      icons: { icon: "/woonhuus-icon.png", apple: "/woonhuus-apple-icon.png" },
      alternates: { canonical: path },
      openGraph: { title, description, url: WOONHUUS_URL, siteName: "Woonhuus", locale: "nl_NL", type: "website" },
      twitter: { card: "summary_large_image", title, description },
      keywords: ["huis te koop", "woning te koop", "koopwoning", "appartement te koop", "eengezinswoning", "starterswoning"],
    };
  }
  const locale = getLocale();
  const path = getPathname();
  const title = t(locale, "meta.title");
  const description = t(locale, "meta.desc");
  return {
    metadataBase: new URL(COMPANY.website),
    title: { default: title, template: "%s · Mooihuus" },
    description,
    applicationName: "Mooihuus",
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.png", apple: "/apple-icon.png" },
    appleWebApp: { capable: true, title: "Mooihuus", statusBarStyle: "default" },
    alternates: {
      canonical: localeHref(locale, path),
      languages: {
        nl: path,
        en: localeHref("en", path),
        de: localeHref("de", path),
        "x-default": path,
      },
    },
    openGraph: {
      title,
      description,
      url: COMPANY.website,
      siteName: "Mooihuus",
      locale: locale === "nl" ? "nl_NL" : locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    keywords: ["recreatiewoning", "vakantiehuis", "te koop", "te huur", "chalet", "bungalow", "tiny house", "recreatiepark"],
  };
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const site = huidigeSite();
  if (site === "woonhuus") return <WoonhuusLayout>{children}</WoonhuusLayout>;
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mooihuus",
    legalName: "Huus B.V.",
    url: COMPANY.website,
    email: COMPANY.email,
    slogan: "Zelf de regie, nooit alleen.",
  };
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mooihuus",
    url: COMPANY.website,
    inLanguage: ["nl", "en", "de"],
  };
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
      </head>
      <body className="font-sans">
        <Providers>
          <I18nProvider locale={locale}>
            <Nav />
            <main className="max-w-6xl mx-auto px-4 py-6 min-h-[70vh]">{children}</main>
            <footer className="bg-creme border-t border-lijn mt-10">
              <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-grijs">
                <Wordmark className="text-lg" />
                <p className="mt-2 max-w-xl">{t(locale, "footer.tagline")}</p>
                <div className="mt-4 max-w-md">
                  <div className="font-display font-semibold text-bosgroen-dk mb-1">📬 {t(locale, "footer.blijf")}</div>
                  <p className="text-xs mb-2">{t(locale, "footer.blijfSub")}</p>
                  <NieuwsbriefForm />
                </div>
                <nav className="mt-4 flex gap-4 flex-wrap font-semibold text-bosgroen-dk">
                  <Link href={localeHref(locale, "/te-koop")} className="hover:underline">{t(locale, "footer.teKoopProvincie")}</Link>
                  <Link href={localeHref(locale, "/openhuizen")} className="hover:underline">{t(locale, "footer.openHuizen")}</Link>
                  <Link href={localeHref(locale, "/huusmeesters")} className="hover:underline">{t(locale, "nav.huusmeesters")}</Link>
                  <Link href={localeHref(locale, "/verkocht")} className="hover:underline">{t(locale, "nav.verkocht")}</Link>
                  <Link href={localeHref(locale, "/zoeker")} className="hover:underline">{t(locale, "nav.zoeker")}</Link>
                  <Link href={localeHref(locale, "/blog")} className="hover:underline">{t(locale, "nav.blog")}</Link>
                  <Link href={localeHref(locale, "/reviews")} className="hover:underline">{t(locale, "footer.reviews")}</Link>
                  <Link href={localeHref(locale, "/ideeenbus")} className="hover:underline">{t(locale, "footer.ideeen")}</Link>
                  <Link href={localeHref(locale, "/contact")} className="hover:underline">{t(locale, "nav.contact")}</Link>
                  <Link href={localeHref(locale, "/faq")} className="hover:underline">{t(locale, "footer.faq")}</Link>
                  <Link href={localeHref(locale, "/voorwaarden")} className="hover:underline">{t(locale, "footer.voorwaarden")}</Link>
                  <Link href={localeHref(locale, "/privacy")} className="hover:underline">{t(locale, "footer.privacy")}</Link>
                  <Link href={localeHref(locale, "/cookies")} className="hover:underline">{t(locale, "footer.cookies")}</Link>
                  <Link href={localeHref(locale, "/disclaimer")} className="hover:underline">{t(locale, "footer.disclaimer")}</Link>
                  <Link href={localeHref(locale, "/woonhuis-zoeken")} className="hover:underline">Gewone woning zoeken? Woonhuus.nl</Link>
                  <Link href="/zusterplatform-woonhuus" className="hover:underline">Ons zusterplatform Woonhuus</Link>
                </nav>
                <p className="mt-4 text-xs text-grijs">
                  {t(locale, "footer.dienstVan")} <strong>Huus B.V.</strong> · {COMPANY.adres}, {COMPANY.postcode} · KvK {COMPANY.kvk} · btw {COMPANY.btw} · © {new Date().getFullYear()} Huus B.V.
                </p>
              </div>
            </footer>
            <CookieBanner />
            <ChatWidget />
            <Analytics />
            <GoogleTag />
            <ServiceWorker />
            <InstallPrompt />
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}

// Woonhuus.nl: zelfde fundament (fonts, cookiebanner, statistieken), eigen
// navigatie, huisstijl (data-site) en footer met verwijzing naar Mooihuus.
function WoonhuusLayout({ children }: { children: React.ReactNode }) {
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Woonhuus",
    legalName: "Huus B.V.",
    url: WOONHUUS_URL,
    email: COMPANY.email,
    parentOrganization: { "@type": "Organization", name: "Mooihuus", url: MOOIHUUS_URL },
  };
  return (
    <html lang="nl" data-site="woonhuus">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#1E3A5F" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </head>
      <body className="font-sans">
        <Providers>
          <I18nProvider locale="nl">
            <WoonhuusNav mooihuusUrl={MOOIHUUS_URL} />
            <main className="max-w-6xl mx-auto px-4 py-6 min-h-[70vh]">{children}</main>
            <footer className="bg-white border-t border-lijn mt-10">
              <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-grijs">
                <Wordmark className="text-lg" site="woonhuus" />
                <p className="mt-2 max-w-xl">Koopwoningen in heel Nederland, aangeboden door makelaars en particulieren. Woonhuus.nl is het zusterplatform van Mooihuus.</p>
                <nav className="mt-4 flex gap-4 flex-wrap font-semibold text-bosgroen-dk" aria-label="Footer">
                  <Link href="/te-koop" className="hover:underline">Te koop per provincie</Link>
                  <Link href="/over-woonhuus" className="hover:underline">Over Woonhuus</Link>
                  <Link href="/over-mooihuus" className="hover:underline">Ons zusterplatform Mooihuus</Link>
                  <Link href="/contact" className="hover:underline">Contact</Link>
                  <Link href="/faq" className="hover:underline">Veelgestelde vragen</Link>
                  <Link href="/voorwaarden" className="hover:underline">Voorwaarden</Link>
                  <Link href="/privacy" className="hover:underline">Privacy</Link>
                  <Link href="/cookies" className="hover:underline">Cookies</Link>
                  <Link href="/disclaimer" className="hover:underline">Disclaimer</Link>
                </nav>
                <a href={MOOIHUUS_URL} className="mt-5 flex items-center gap-3 rounded-xl border border-lijn bg-zand p-4 hover:shadow-sm transition-shadow">
                  <span className="font-display font-bold text-bosgroen-dk">Op zoek naar een recreatiewoning of vakantiehuis?</span>
                  <span className="ml-auto font-semibold text-bosgroen">Naar Mooihuus.nl →</span>
                </a>
                <p className="mt-4 text-xs text-grijs">
                  Woonhuus.nl en Mooihuus.nl zijn diensten van <strong>Huus B.V.</strong> · {COMPANY.adres}, {COMPANY.postcode} · KvK {COMPANY.kvk} · btw {COMPANY.btw} · © {new Date().getFullYear()} Huus B.V.
                </p>
              </div>
            </footer>
            <CookieBanner />
            <Analytics />
            <GoogleTag />
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
