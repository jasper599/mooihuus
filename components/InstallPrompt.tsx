"use client";

import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [iosHint, setIosHint] = useState(false);
  const [dicht, setDicht] = useState(false);

  useEffect(() => {
    // Al geïnstalleerd? Dan niks tonen.
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (standalone) return;

    const onPrompt = (e: any) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari ondersteunt geen prompt → toon eenmalig een korte hint.
    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS && isSafari) {
      try {
        if (!localStorage.getItem("mooihuus:ios-hint")) setIosHint(true);
      } catch {}
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (dicht) return null;

  if (deferred) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm bg-white border border-lijn rounded-2xl shadow-lg p-3 flex items-center gap-3">
        <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
        <div className="flex-1 text-sm">
          <div className="font-display font-bold text-bosgroen-dk">Mooihuus op je startscherm</div>
          <div className="text-grijs text-xs">Installeer de app — geen store nodig.</div>
        </div>
        <button
          onClick={async () => { deferred.prompt(); await deferred.userChoice; setDeferred(null); }}
          className="btn btn-green text-sm"
        >
          Installeer
        </button>
        <button onClick={() => setDicht(true)} aria-label="Sluiten" className="text-grijs px-1">✕</button>
      </div>
    );
  }

  if (iosHint) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm bg-white border border-lijn rounded-2xl shadow-lg p-3 flex items-center gap-3">
        <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
        <div className="flex-1 text-sm">
          <div className="font-display font-bold text-bosgroen-dk">Zet Mooihuus op je startscherm</div>
          <div className="text-grijs text-xs">Tik op <strong>Deel</strong> ⬆️ en dan “Zet op beginscherm”.</div>
        </div>
        <button
          onClick={() => { try { localStorage.setItem("mooihuus:ios-hint", "1"); } catch {}; setIosHint(false); }}
          aria-label="Sluiten"
          className="text-grijs px-1"
        >✕</button>
      </div>
    );
  }

  return null;
}
