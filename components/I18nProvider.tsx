"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Locale, t as translate, stripLocale } from "@/lib/i18n";

const Ctx = createContext<Locale>("nl");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

// Bepaalt de actieve taal uit de URL. Dit is bewust reactief: de root-layout
// (en dus de provider-waarde) rendert NIET opnieuw bij een client-side
// taalwissel, waardoor de context blijft hangen op de taal van het eerste
// paginabezoek. usePathname wisselt wél mee, dus die is leidend. De
// server-context dient enkel als terugval als er (nog) geen pad is.
export function useLocale(): Locale {
  const ctx = useContext(Ctx);
  const path = usePathname();
  if (!path) return ctx;
  return stripLocale(path).locale;
}

export function useT() {
  const locale = useLocale();
  return (key: string) => translate(locale, key);
}
