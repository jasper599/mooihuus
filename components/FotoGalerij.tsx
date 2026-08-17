
"use client";
 
import { useEffect, useRef, useState } from "react";
 
// Fotogalerij met schermvullende lightbox. Tik op een foto → vergroot,
// met vorige/volgende, swipen op mobiel, en sluiten met ✕ of Escape.
export function FotoGalerij({
  fotos,
  titel,
  bg,
  children,
}: {
  fotos: string[];
  titel: string;
  bg?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);
  const heeft = fotos && fotos.length > 0;
  const meer = fotos.length > 1;
 
  const openAt = (i: number) => {
    setIdx(i);
    setOpen(true);
  };
  const next = () => setIdx((i) => (i + 1) % fotos.length);
  const prev = () => setIdx((i) => (i - 1 + fotos.length) % fotos.length);
 
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fotos.length]);
 
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40 && meer) (dx < 0 ? next : prev)();
    touchX.current = null;
  }
 
  return (
    <>
      <div className="h-64 rounded-2xl relative overflow-hidden" style={bg ? { background: bg } : undefined}>
        {heeft && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotos[0]}
            alt={titel}
            decoding="async"
            onClick={() => openAt(0)}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          />
        )}
        {children}
        {heeft && (
          <button
            onClick={() => openAt(0)}
            aria-label="Foto vergroten"
            className="absolute bottom-3 right-3 bg-black/45 hover:bg-black/65 text-white rounded-full p-2 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
            </svg>
          </button>
        )}
      </div>
 
      {meer && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {fotos.slice(1).map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={f}
              alt={`${titel} foto ${i + 2}`}
              loading="lazy"
              onClick={() => openAt(i + 1)}
              className="w-full h-24 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            />
          ))}
        </div>
      )}
 
      {open && heeft && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center select-none"
          onClick={() => setOpen(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            aria-label="Sluiten"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="absolute top-4 right-4 text-white bg-white/15 hover:bg-white/30 rounded-full p-2.5 transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
 
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[idx]}
            alt={`${titel} foto ${idx + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
          />
 
          {meer && (
            <>
              <button
                aria-label="Vorige foto"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-white/15 hover:bg-white/30 rounded-full p-3 transition-colors"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                aria-label="Volgende foto"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-white/15 hover:bg-white/30 rounded-full p-3 transition-colors"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/90 text-sm font-display font-semibold bg-black/40 rounded-full px-3 py-1">
                {idx + 1} / {fotos.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
 

