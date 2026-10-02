import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Expliciete allow voor de verzendroute staat vóór de brede /api-disallow;
      // volgens de robots-standaard wint de meest specifieke (langste) regel,
      // zodat de geautomatiseerde Guus-sessie dit eindpunt mag ophalen.
      allow: ["/", "/api/mail/send"],
      disallow: ["/beheer", "/dashboard", "/account", "/betaling", "/api"],
    },
    sitemap: `${COMPANY.website}/sitemap.xml`,
    host: COMPANY.website,
  };
}
