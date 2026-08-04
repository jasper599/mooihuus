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
export const viewport = {
  themeColor: "#2C6B45",
};
export async function generateMetadata(): Promise<Metadata> {
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
                  <div className="font-display font-semibold text-bosgroen-dk mb-1">📬 Blijf op de hoogte</div>
                  <p className="text-xs mb-2">Nieuwe woningen en handige tips in je inbox. Je kunt je altijd afmelden.</p>
                  <NieuwsbriefForm />
                </div>
                <nav className="mt-4 flex gap-4 flex-wrap font-semibold text-bosgroen-dk">
                  <Link href={localeHref(locale, "/te-koop")} className="hover:underline">Te koop per provincie</Link>
                  <Link href={localeHref(locale, "/openhuizen")} className="hover:underline">Open huizen</Link>
                  <Link href={localeHref(locale, "/huusmeesters")} className="hover:underline">{t(locale, "nav.huusmeesters")}</Link>
                  <Link href={localeHref(locale, "/verkocht")} className="hover:underline">{t(locale, "nav.verkocht")}</Link>
                  <Link href={localeHref(locale, "/zoeker")} className="hover:underline">{t(locale, "nav.zoeker")}</Link>
                  <Link href={localeHref(locale, "/blog")} className="hover:underline">{t(locale, "nav.blog")}</Link>
                  <Link href={localeHref(locale, "/reviews")} className="hover:underline">{t(locale, "footer.reviews")}</Link>
                  <Link href={localeHref(locale, "/contact")} className="hover:underline">{t(locale, "nav.contact")}</Link>
                  <Link href={localeHref(locale, "/faq")} className="hover:underline">{t(locale, "footer.faq")}</Link>
                  <Link href={localeHref(locale, "/voorwaarden")} className="hover:underline">{t(locale, "footer.voorwaarden")}</Link>
                  <Link href={localeHref(locale, "/privacy")} className="hover:underline">{t(locale, "footer.privacy")}</Link>
                  <Link href={localeHref(locale, "/cookies")} className="hover:underline">{t(locale, "footer.cookies")}</Link>
                  <Link href={localeHref(locale, "/disclaimer")} className="hover:underline">{t(locale, "footer.disclaimer")}</Link>
                </nav>
                <p className="mt-4 text-xs text-grijs">
                  Mooihuus.nl is een dienst van <strong>Huus B.V.</strong> · {COMPANY.adres}, {COMPANY.postcode} · KvK {COMPANY.kvk} · btw {COMPANY.btw} · © {new Date().getFullYear()} Huus B.V.
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
