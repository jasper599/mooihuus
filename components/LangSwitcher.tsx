"use client";

import { useRouter, usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABEL, stripLocale } from "@/lib/i18n";

export function LangSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale: cur, rest } = stripLocale(pathname);

  function set(l: string) {
    const target = l === "nl" ? rest || "/" : `/${l}${rest === "/" ? "" : rest}`;
    router.push(target);
  }

  return (
    <div className="flex items-center gap-0.5 ml-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          aria-label={`Taal: ${l}`}
          className={`text-xs font-display font-bold rounded px-1.5 py-1 ${
            cur === l ? "bg-bosgroen text-white" : "text-grijs hover:bg-zand"
          }`}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
