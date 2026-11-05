"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Wordmark } from "./Wordmark";

// Navigatie van Woonhuus.nl. Inloggen, plaatsen en het dashboard blijven op
// Mooihuus.nl (één account voor beide etalages), dus die links gaan daarheen,
// met ?via=woonhuus zodat die pagina's in Woonhuus-stijl verschijnen.
// Met `basis` (de Woonhuus-URL) wordt dezelfde navigatie op de accountpagina's
// van Mooihuus.nl gebruikt; de etalagelinks gaan dan terug naar Woonhuus.nl.
export function WoonhuusNav({ mooihuusUrl, basis = "" }: { mooihuusUrl: string; basis?: string }) {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const opAccount = !!basis; // we staan op een accountpagina van Mooihuus.nl
  const acc = (p: string) => (opAccount ? p : `${mooihuusUrl}${p}${p.includes("?") ? "&" : "?"}via=woonhuus`);
  const links = [
    { href: `${basis}/te-koop`, label: "Koopwoningen" },
    { href: `${basis}/te-koop#provincies`, label: "Per provincie" },
    { href: `${basis}/favorieten`, label: "Favorieten" },
  ];
  const actief = (href: string) => !opAccount && (href === "/" ? path === "/" || path === "/woonhuus" : path.startsWith(href) || path.startsWith("/woonhuus" + href));
  const extern = [
    { href: acc("/plaatsen?categorie=woonhuis"), label: "Woning plaatsen" },
    ...(session ? [{ href: acc("/dashboard"), label: "Mijn dashboard" }] : []),
    { href: `${mooihuusUrl}/?via=mooihuus`, label: "Recreatiewoningen ↗" },
  ];
  const uitloggen = () => signOut({ callbackUrl: `${basis || ""}/` || "/" });
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-lijn">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        <Link href={`${basis}/`} className="mr-auto" onClick={() => setOpen(false)} aria-label="Woonhuus.nl, naar de homepage">
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
          {session ? (
            <button onClick={uitloggen} className="btn btn-green text-[0.82rem] ml-1">Uitloggen</button>
          ) : (
            <a href={acc("/inloggen")} className="btn btn-green text-[0.82rem] ml-1">Inloggen</a>
          )}
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
          {session ? (
            <button onClick={uitloggen} className="btn btn-green mt-2">Uitloggen</button>
          ) : (
            <a href={acc("/inloggen")} className="btn btn-green mt-2">Inloggen</a>
          )}
        </nav>
      )}
    </header>
  );
}
