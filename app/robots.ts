import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Alleen de UI-pagina's met privégegevens afschermen. /api staat bewust
      // niet meer als blok: die routes geven JSON terug, gevoelige endpoints
      // zitten achter login, en een brede /api-disallow blokkeerde ook de
      // verzendroute voor geautomatiseerde ophalers (die de 'langste regel
      // wint'-uitzondering niet respecteren).
      disallow: ["/beheer", "/dashboard", "/account", "/betaling"],
    },
    sitemap: `${COMPANY.website}/sitemap.xml`,
    host: COMPANY.website,
  };
}
