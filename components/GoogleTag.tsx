"use client";

import { useEffect } from "react";

const GA_ID = "AW-807554484";

// Google-tag (Google Ads). Wordt pas geladen nadat de bezoeker in de
// cookiemelding voor "Accepteren" heeft gekozen. Zonder die keuze komt er
// geen Google-script op de pagina en wordt er niets naar Google gestuurd.
export function GoogleTag() {
  useEffect(() => {
    const w = window as any;

    const laad = () => {
      if (w.__gtagLoaded) return;
      w.__gtagLoaded = true;
      w.dataLayer = w.dataLayer || [];
      function gtag(...args: any[]) {
        w.dataLayer.push(args);
      }
      w.gtag = gtag;
      gtag("consent", "default", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(s);
      gtag("js", new Date());
      gtag("config", GA_ID);
    };

    const heeftToestemming = () => {
      try {
        return localStorage.getItem("mh-cookieconsent") === "alles";
      } catch {
        return false;
      }
    };

    if (heeftToestemming()) {
      laad();
      return;
    }

    const onConsent = (e: Event) => {
      if ((e as CustomEvent).detail === "alles") laad();
    };
    window.addEventListener("mh-consent", onConsent);
    const poll = window.setInterval(() => {
      if (heeftToestemming()) {
        laad();
        window.clearInterval(poll);
      }
    }, 1500);

    return () => {
      window.removeEventListener("mh-consent", onConsent);
      window.clearInterval(poll);
    };
  }, []);

  return null;
}
