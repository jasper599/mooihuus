import { headers } from "next/headers";
import { Site, siteVanHost } from "./site";

// De etalage van het huidige verzoek (server components / route handlers).
export function huidigeSite(): Site {
  const h = headers();
  const x = h.get("x-site");
  if (x === "woonhuus" || x === "mooihuus") return x;
  return siteVanHost(h.get("host"));
}
