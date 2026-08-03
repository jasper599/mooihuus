"use client";

import { useState } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => (typeof window !== "undefined" ? window.location.href : "");
  const tekst = () => `${title} — Mooihuus.nl`;

  const open = (u: string) => window.open(u, "_blank", "noopener,noreferrer");

  async function native() {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text: tekst(), url: url() });
      } catch {
        /* geannuleerd */
      }
    } else {
      copy();
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* niet beschikbaar */
    }
  }

  const btn = "inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-3 py-1.5 border border-lijn bg-white hover:bg-zand text-inkt";

  return (
    <div>
      <div className="text-sm font-semibold mb-2">Deel deze woning</div>
      <div className="flex flex-wrap gap-2">
        <button onClick={native} className={btn} aria-label="Delen">📤 Delen</button>
        <button onClick={() => open(`https://wa.me/?text=${encodeURIComponent(tekst() + " " + url())}`)} className={btn} aria-label="WhatsApp">🟢 WhatsApp</button>
        <button onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)} className={btn} aria-label="Facebook">🔵 Facebook</button>
        <button onClick={copy} className={btn} aria-label="Instagram">📸 Instagram</button>
        <button onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tekst())}&url=${encodeURIComponent(url())}`)} className={btn} aria-label="X">✖️ X</button>
        <button onClick={() => open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(tekst() + " " + url())}`)} className={btn} aria-label="E-mail">✉️ E-mail</button>
        <button onClick={copy} className={btn} aria-label="Kopieer link">🔗 {copied ? "Gekopieerd!" : "Kopieer link"}</button>
      </div>
      <p className="text-xs text-grijs mt-1.5">Tip: voor Instagram kopieer je de link en plak je 'm in je story of bio.</p>
    </div>
  );
}
