"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Wordmark";

// Navigatie van Woonhuus.nl. Inloggen, plaatsen en het dashboard blijven op
// Mooihuus.nl (één account voor beide etalages), dus die links gaan daarheen.
export function WoonhuusNav({ mooihuusUrl }: { mooihuusUrl: string }) {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: "Koopwoningen" },
    { href: "/huren", label: "Huurwoningen" },
    { href: "/te-koop", label: "Per provincie" },
    { href: "/favorieten", label: "Favorieten" },
  ];
  const actief = (href: string) => (href === "/" ? path === "/" || path === "/woonhuus" : path.startsWith(href) || path.startsWith("/woonhuus" + href));
  const extern = [
    { href: `${mooihuusUrl}/plaatsen?categorie=woonhuis`, label: "Woning plaatsen" },
    { href: mooihuusUrl, label: "Recreatiewoningen ↗" },
  ];
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-lijn">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        <Link href="/" className="mr-auto" onClick={() => setOpen(false)} aria-label="Woonhuus.nl, naar de homepage">
          <Wordmark className="text-xl" site="woonhuus" />
        </Link>
        <nav className="hidden md:flex items-center gap-1" aria-label="Hoofdmenu">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`font-display font-semibold text-[0.82rem] whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
                actief(l.href) ? "bg-bosgroen text-white" : "text-bosgroen-dk hover:bg-zand"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <span className="w-px h-5 bg-lijn mx-1" />
          {extern.map((l) => (
            <a key={l.href} href={l.href} className="font-display font-semibold text-[0.82rem] whitespace-nowrap rounded-full px-3 py-1.5 text-bosgroen-dk hover:bg-zand">
              {l.label}
            </a>
          ))}
          <a href={`${mooihuusUrl}/inloggen`} className="btn btn-green text-[0.82rem] ml-1">Inloggen</a>
        </nav>
        <button
          className="md:hidden rounded-lg px-3 py-2 text-bosgroen-dk font-display font-semibold"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? "Sluiten" : "Menu"}
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-lijn bg-white px-4 py-3 flex flex-col gap-1" aria-label="Hoofdmenu">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`font-display font-semibold rounded-lg px-3 py-2.5 ${actief(l.href) ? "bg-bosgroen text-white" : "text-bosgroen-dk hover:bg-zand"}`}>
              {l.label}
            </Link>
          ))}
          {extern.map((l) => (
            <a key={l.href} href={l.href} className="font-display font-semibold rounded-lg px-3 py-2.5 text-bosgroen-dk hover:bg-zand">{l.label}</a>
          ))}
          <a href={`${mooihuusUrl}/inloggen`} className="btn btn-green mt-2">Inloggen</a>
        </nav>
      )}
    </header>
  );
}
