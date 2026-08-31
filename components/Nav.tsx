
"use client";
 
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Wordmark } from "./Wordmark";
import { useT } from "./I18nProvider";
import { LangSwitcher } from "./LangSwitcher";
import { localeHref, stripLocale } from "@/lib/i18n";
 
function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
 
export function Nav() {
  const path = usePathname();
  const { locale, rest } = stripLocale(path);
  const { data: session } = useSession();
  const t = useT();
  const rol = (session?.user as any)?.rol;
  const [open, setOpen] = useState(false);
  const [meerOpen, setMeerOpen] = useState(false);
 
  const meerLabel = locale === "de" ? "Mehr" : locale === "en" ? "More" : "Meer";
 
  // Zichtbare hoofdlinks
  const primary = [
    { href: "/", label: t("nav.aanbod") },
    { href: "/plaatsen", label: t("nav.plaats") },
    { href: "/huusmeesters", label: t("nav.huusmeesters") },
    ...(session ? [{ href: "/dashboard", label: t("nav.dashboard") }] : []),
    ...(rol === "beheerder" ? [{ href: "/beheer", label: t("nav.beheer") }] : []),
  ];
  // Icoon-links
  const iconLinks = [
    { href: "/zoeker", label: t("nav.zoeker"), Icon: BellIcon },
    { href: "/favorieten", label: t("nav.favorieten"), Icon: HeartIcon },
  ];
  // Secundaire links onder 'Meer'
  const meer = [
    { href: "/blog", label: t("nav.blog") },
    { href: "/mantelzorg", label: t("nav.mantelzorg") },
    { href: "/verkocht", label: t("nav.verkocht") },
    { href: "/openhuizen", label: locale === "de" ? "Tage der offenen Tür" : locale === "en" ? "Open houses" : "Open huizen" },
    { href: "/reviews", label: t("footer.reviews") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/faq", label: t("footer.faq") },
  ];
 
  const isActive = (href: string) => (href === "/" ? rest === "/" : rest.startsWith(href));
 
  const deskLink = (href: string, label: string) => (
    <Link
      key={href}
      href={localeHref(locale, href)}
      className={`font-display font-semibold text-[0.82rem] whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
        isActive(href) ? "bg-bosgroen text-white" : "text-bosgroen-dk hover:bg-zand"
      }`}
    >
      {label}
    </Link>
  );
 
  const mobLink = (href: string, label: string) => (
    <Link
      key={href}
      href={localeHref(locale, href)}
      onClick={() => setOpen(false)}
      className={`font-display font-semibold text-[0.95rem] rounded-lg px-3 py-2.5 transition-colors ${
        isActive(href) ? "bg-bosgroen text-white" : "text-bosgroen-dk hover:bg-zand"
      }`}
    >
      {label}
    </Link>
  );
 
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-lijn">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        <Link href={localeHref(locale, "/")} className="mr-auto" onClick={() => setOpen(false)}>
          <Wordmark className="text-xl" />
        </Link>
 
        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {primary.map((l) => deskLink(l.href, l.label))}
 
          {/* Meer-menu */}
          <div className="relative">
            <button
              onClick={() => setMeerOpen((v) => !v)}
              aria-expanded={meerOpen}
              className={`font-display font-semibold text-[0.82rem] whitespace-nowrap rounded-full px-3 py-1.5 flex items-center gap-1 transition-colors ${
                meerOpen ? "bg-zand text-bosgroen-dk" : "text-bosgroen-dk hover:bg-zand"
              }`}
            >
              {meerLabel}
              <span className="text-[0.6rem] leading-none">▾</span>
            </button>
            {meerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMeerOpen(false)} />
                <div className="absolute right-0 mt-1 z-50 min-w-[180px] bg-white border border-lijn rounded-xl shadow-lg py-1">
                  {meer.map((m) => (
                    <Link
                      key={m.href}
                      href={localeHref(locale, m.href)}
                      onClick={() => setMeerOpen(false)}
                      className="block px-4 py-2 text-[0.85rem] font-display font-semibold text-bosgroen-dk hover:bg-zand"
                    >
                      {m.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
 
          {/* Icoon-links */}
          <span className="w-px h-5 bg-lijn mx-1" />
          {iconLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={localeHref(locale, href)}
              aria-label={label}
              title={label}
              className={`rounded-full p-2 transition-colors ${
                isActive(href) ? "bg-bosgroen text-white" : "text-bosgroen-dk hover:bg-zand"
              }`}
            >
              <Icon />
            </Link>
          ))}
 
          {/* Account */}
          {session ? (
            <>
              <Link href="/account" className="font-display font-semibold text-[0.82rem] whitespace-nowrap rounded-full px-3 py-1.5 text-bosgroen-dk hover:bg-zand">
                {session.user?.name?.split(" ")[0] ?? t("nav.account")}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="font-display font-semibold text-[0.82rem] whitespace-nowrap rounded-full px-3 py-1.5 text-grijs hover:bg-zand">
                {t("nav.uitloggen")}
              </button>
            </>
          ) : (
            <>
              {deskLink("/inloggen", t("nav.inloggen"))}
              <Link href={localeHref(locale, "/registreren")} className="font-display font-semibold text-[0.82rem] whitespace-nowrap rounded-full px-3 py-1.5 bg-oranje text-white hover:bg-oranje-dk">
                {t("nav.registreren")}
              </Link>
            </>
          )}
          <LangSwitcher />
        </nav>
 
        {/* Mobiel: taal + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <LangSwitcher />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="p-2 rounded-lg text-bosgroen-dk hover:bg-zand"
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>
 
      {/* Mobiel menu-paneel */}
      {open && (
        <nav className="md:hidden border-t border-lijn bg-white px-4 py-3 flex flex-col gap-1">
          {primary.map((l) => mobLink(l.href, l.label))}
          {iconLinks.map((l) => mobLink(l.href, l.label))}
          {meer.map((l) => mobLink(l.href, l.label))}
          <div className="border-t border-lijn my-2" />
          {session ? (
            <>
              <Link href="/account" onClick={() => setOpen(false)} className="font-display font-semibold text-[0.95rem] rounded-lg px-3 py-2.5 text-bosgroen-dk hover:bg-zand">
                {session.user?.name?.split(" ")[0] ?? t("nav.account")}
              </Link>
              <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }} className="text-left font-display font-semibold text-[0.95rem] rounded-lg px-3 py-2.5 text-grijs hover:bg-zand">
                {t("nav.uitloggen")}
              </button>
            </>
          ) : (
            <>
              {mobLink("/inloggen", t("nav.inloggen"))}
              <Link href={localeHref(locale, "/registreren")} onClick={() => setOpen(false)} className="font-display font-semibold text-[0.95rem] rounded-lg px-3 py-2.5 bg-oranje text-white text-center hover:bg-oranje-dk">
                {t("nav.registreren")}
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
 

