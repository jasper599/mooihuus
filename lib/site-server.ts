import { headers } from "next/headers";
import { Site, siteVanHost } from "./site";

// De etalage van het huidige verzoek (server components / route handlers).
export function huidigeSite(): Site {
  const h = headers();
  const x = h.get("x-site");
  if (x === "woonhuus" || x === "mooihuus") return x;
  return siteVanHost(h.get("host"));
}

// De huisstijl van het huidige verzoek. Gelijk aan de etalage, behalve op de
// accountpagina's van Mooihuus.nl voor wie vanaf Woonhuus.nl komt.
export function huidigeSkin(): Site {
  const h = headers();
  if (h.get("x-skin") === "woonhuus") return "woonhuus";
  return huidigeSite();
}
