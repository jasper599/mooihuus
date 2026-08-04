"use client";

import { useEffect } from "react";

const GA_ID = "AW-18370852382";

export function GoogleTag() {
  useEffect(() => {
    const w = window as any;
    if (w.__gtagLoaded) return;
    w.__gtagLoaded = true;

    w.dataLayer = w.dataLayer || [];
    function gtag(...args: any[]) {
      w.dataLayer.push(args);
    }
    w.gtag = gtag;

    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });

    let consent = "noodzakelijk";
    try {
      consent = localStorage.getItem("mh-cookieconsent") || "noodzakelijk";
    } catch {}
    if (consent === "alles") {
      gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
    }

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    gtag("js", new Date());
    gtag("config", GA_ID);

    let granted = consent === "alles";
    const grant = () => {
      if (granted) return;
      granted = true;
      gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
    };
    const onConsent = (e: Event) => {
      if ((e as CustomEvent).detail === "alles") grant();
    };
    window.addEventListener("mh-consent", onConsent);
    const poll = window.setInterval(() => {
      try {
        if (localStorage.getItem("mh-cookieconsent") === "alles") grant();
      } catch {}
      if (granted) window.clearInterval(poll);
    }, 1500);

    return () => {
      window.removeEventListener("mh-consent", onConsent);
      window.clearInterval(poll);
    };
  }, []);

  return null;
}
