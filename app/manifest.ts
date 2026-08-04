import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
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
