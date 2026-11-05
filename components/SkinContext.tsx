"use client";

import { createContext, useContext } from "react";

// Huisstijl waarin de pagina getoond wordt: Mooihuus of Woonhuus. Op de
// accountpagina's van Mooihuus.nl is dat Woonhuus voor wie vanaf Woonhuus komt.
const SkinContext = createContext<"mooihuus" | "woonhuus">("mooihuus");

export function SkinProvider({ skin, children }: { skin: "mooihuus" | "woonhuus"; children: React.ReactNode }) {
  return <SkinContext.Provider value={skin}>{children}</SkinContext.Provider>;
}

export function useSkin() {
  return useContext(SkinContext);
}

// Platformnaam voor teksten in de huidige huisstijl.
export function usePlatformNaam() {
  return useSkin() === "woonhuus" ? "Woonhuus" : "Mooihuus";
}
