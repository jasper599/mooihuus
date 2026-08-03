"use client";

import { createContext, useContext } from "react";
import { Locale, t as translate } from "@/lib/i18n";

const Ctx = createContext<Locale>("nl");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export function useLocale(): Locale {
  return useContext(Ctx);
}

export function useT() {
  const locale = useContext(Ctx);
  return (key: string) => translate(locale, key);
}
