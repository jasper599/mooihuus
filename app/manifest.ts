import type { MetadataRoute } from "next";
import { huidigeSite } from "@/lib/site-server";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  if (huidigeSite() === "woonhuus") {
    return {
      name: "Woonhuus: koop- en huurwoningen",
      short_name: "Woonhuus",
      description: "Koop- en huurwoningen in heel Nederland, rechtstreeks van de makelaar. Een platform van Mooihuus.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#F4F6F8",
      theme_color: "#1E3A5F",
      lang: "nl",
      icons: [
        { src: "/woonhuus-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/woonhuus-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/woonhuus-icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    };
  }
  return {
    name: "Mooihuus — recreatiewoningen kopen, verkopen & huren",
    short_name: "Mooihuus",
    description:
      "Het onafhankelijke platform voor recreatiewoningen: zelf te koop of te huur zetten, favorieten bewaren, en alles eromheen via de Huusmeesters.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF8F1",
    theme_color: "#2C6B45",
    lang: "nl",
    categories: ["business", "lifestyle", "shopping"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
