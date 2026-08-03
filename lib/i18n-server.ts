import { headers, cookies } from "next/headers";
import { normalizeLocale, Locale } from "./i18n";

// Taal uit de URL (via middleware-header x-locale). Valt terug op cookie, dan nl.
export function getLocale(): Locale {
  const h = headers().get("x-locale");
  if (h === "en" || h === "de" || h === "nl") return h;
  return normalizeLocale(cookies().get("locale")?.value);
}

export function getPathname(): string {
  return headers().get("x-pathname") || "/";
}
