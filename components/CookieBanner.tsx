"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "./I18nProvider";

export function CookieBanner() {
  const t = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("mh-cookieconsent")) setShow(true);
    } catch {
      /* localStorage niet beschikbaar */
    }
  }, []);

  function kies(keuze: "alles" | "noodzakelijk") {
    try {
      localStorage.setItem("mh-cookieconsent", keuze);
    } catch {
      /* negeer */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-[100] max-w-3xl mx-auto bg-white border border-lijn rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="text-sm text-inkt flex-1">
        {t("cookie.text")}{" "}
        <Link href="/cookies" className="text-bosgroen font-semibold">{t("cookie.more")}</Link>.
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => kies("noodzakelijk")} className="btn btn-ghost text-sm">{t("cookie.necessary")}</button>
        <button onClick={() => kies("alles")} className="btn text-sm">{t("cookie.accept")}</button>
      </div>
    </div>
  );
}
