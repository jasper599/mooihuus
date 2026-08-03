"use client";

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

  const links = [
    { href: "/", label: t("nav.aanbod") },
    { href: "/plaatsen", label: t("nav.plaats") },
    { href: "/huusmeesters", label: t("nav.huusmeesters") },
    { href: "/blog", label: t("nav.blog") },
    ...(session ? [{ href: "/dashboard", label: t("nav.dashboard") }] : []),
    ...(rol === "beheerder" ? [{ href: "/beheer", label: t("nav.beheer") }] : []),
  ];

  const link = (href: string, label: string) => {
    const active = href === "/" ? rest === "/" : rest.startsWith(href);
    return (
      <Link
        key={href}
        href={localeHref(locale, href)}
        className={`font-display font-semibold text-[0.82rem] rounded-full px-3 py-1.5 transition-colors ${
          active ? "bg-bosgroen text-white" : "text-bosgroen-dk hover:bg-zand"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-lijn">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-1 flex-wrap">
        <Link href={localeHref(locale, "/")} className="mr-auto">
          <Wordmark className="text-xl" />
        </Link>
        <nav className="flex items-center gap-1 flex-wrap">
          {links.map((l) => link(l.href, l.label))}
          {session ? (
            <>
              <Link href="/account" className="font-display font-semibold text-[0.82rem] rounded-full px-3 py-1.5 text-bosgroen-dk hover:bg-zand">
                {session.user?.name?.split(" ")[0] ?? t("nav.account")}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="font-display font-semibold text-[0.82rem] rounded-full px-3 py-1.5 text-grijs hover:bg-zand"
              >
                {t("nav.uitloggen")}
              </button>
            </>
          ) : (
            <>
              {link("/inloggen", t("nav.inloggen"))}
              <Link href={localeHref(locale, "/registreren")} className="font-display font-semibold text-[0.82rem] rounded-full px-3 py-1.5 bg-oranje text-white hover:bg-oranje-dk">
                {t("nav.registreren")}
              </Link>
            </>
          )}
          <LangSwitcher />
        </nav>
      </div>
    </header>
  );
}
