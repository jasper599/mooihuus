"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Privacyvriendelijke, eigen pageview-tracking. Geen cookies: een anonieme
// bezoeker-id in localStorage. Stuurt bij elke paginawissel een seintje.
function getVid(): string {
  try {
    let v = localStorage.getItem("mooihuus:vid");
    if (!v) {
      v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)) as string;
      localStorage.setItem("mooihuus:vid", v);
    }
    return v;
  } catch {
    return "anon";
  }
}

export function Analytics() {
  const pathname = usePathname();
  const eerste = useRef(true);

  useEffect(() => {
    // referrer alleen bij de allereerste pagina van het bezoek (externe herkomst)
    const ref = eerste.current ? document.referrer : "";
    eerste.current = false;
    const body = JSON.stringify({ path: pathname, vid: getVid(), ref });
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", blob);
      else fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    } catch {
      /* stil negeren */
    }
  }, [pathname]);

  return null;
}
