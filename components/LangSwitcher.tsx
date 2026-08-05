
Cloud




































Langswitcher · TSX
"use client";
 
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABEL, stripLocale } from "@/lib/i18n";
 
export function LangSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale: cur, rest } = stripLocale(pathname);
  const [open, setOpen] = useState(false);
 
  function set(l: string) {
    const target = l === "nl" ? rest || "/" : `/${l}${rest === "/" ? "" : rest}`;
    setOpen(false);
    router.push(target);
  }
 
  return (
    <div className="relative ml-1">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Taal kiezen"
        aria-expanded={open}
        className="text-xs font-display font-bold rounded px-2 py-1 text-bosgroen-dk hover:bg-zand flex items-center gap-0.5"
      >
        {LOCALE_LABEL[cur]}
        <span className="text-[0.6rem] leading-none">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-50 min-w-[64px] bg-white border border-lijn rounded-lg shadow-lg py-1">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => set(l)}
                className={`block w-full text-left text-xs font-display font-bold px-3 py-1.5 ${
                  cur === l ? "bg-bosgroen text-white" : "text-grijs hover:bg-zand"
                }`}
              >
                {LOCALE_LABEL[l]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
 

