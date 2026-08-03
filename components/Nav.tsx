"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Wordmark } from "./Wordmark";
import { useT } from "./I18nProvider";
import { LangSwitcher } from "./LangSwitcher";
import { localeHref, stripLocale } from "@/lib/i18n";

export function Nav() {
  const path = usePathname();
  const { locale, rest } = stripLocale(path);
  const { data: session } = useSession();
  const t = useT();
  const rol = (session?.user as any)?.rol;
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("nav.aanbod") },
    { href: "/plaatsen", label: t("nav.plaats") },
    { href: "/zoeker", label: t("nav.zoeker") },
    { href: "/huusmeesters", label: t("nav.huusmeesters") },
    { href: "/blog", label: t("nav.blog") },
    ...(session ? [{ href: "/dashboard", label: t("nav.dashboard") }] : []),
    ...(rol === "beheerder" ? [{ href: "/beheer", label: t("nav.beheer") }] : []),
  ];

  const isActive = (href: string) => (href === "/" ? rest === "/" : rest.startsWith(href));

  const deskLink = (href: string, label: string) => (
    <Link
      key={href}
      href={localeHref(locale, href)}
      className={`font-display font-semibold text-[0.82rem] rounded-full px-3 py-1.5 transition-colors ${
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
          {links.map((l) => deskLink(l.href, l.label))}
          {session ? (
            <>
              <Link href="/account" className="font-display font-semibold text-[0.82rem] rounded-full px-3 py-1.5 text-bosgroen-dk hover:bg-zand">
                {session.user?.name?.split(" ")[0] ?? t("nav.account")}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="font-display font-semibold text-[0.82rem] rounded-full px-3 py-1.5 text-grijs hover:bg-zand">
                {t("nav.uitloggen")}
              </button>
            </>
          ) : (
            <>
              {deskLink("/inloggen", t("nav.inloggen"))}
              <Link href={localeHref(locale, "/registreren")} className="font-display font-semibold text-[0.82rem] rounded-full px-3 py-1.5 bg-oranje text-white hover:bg-oranje-dk">
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
          {links.map((l) => mobLink(l.href, l.label))}
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
