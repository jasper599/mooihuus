"use client";

import { useState } from "react";
import { useT } from "./I18nProvider";

function euro(n: number): string {
  return "€ " + Math.round(n).toLocaleString("nl-NL");
}

export function MaandlastenCalculator({ prijs }: { prijs: number }) {
  const t = useT();
  const [aankoop, setAankoop] = useState(prijs || 0);
  const [inbreng, setInbreng] = useState(Math.round((prijs || 0) * 0.1));
  const [rente, setRente] = useState(4.5);
  const [jaar, setJaar] = useState(30);

  const lening = Math.max(0, aankoop - inbreng);
  const r = rente / 100 / 12;
  const n = jaar * 12;
  const maand = lening <= 0 ? 0 : r === 0 ? lening / n : (lening * r) / (1 - Math.pow(1 + r, -n));

  const veld = (
    label: string,
    value: number,
    set: (n: number) => void,
    min: number,
    max: number,
    step: number,
    weergave: string
  ) => (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-grijs">{label}</span>
        <span className="font-semibold">{weergave}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-bosgroen" />
    </div>
  );

  return (
    <div className="card mt-4">
      <div className="font-display font-bold text-bosgroen-dk mb-1">{t("calc.title")}</div>
      <p className="text-xs text-grijs mb-3">{t("calc.sub")}</p>
      <div className="space-y-3">
        {veld(t("calc.aankoopprijs"), aankoop, setAankoop, 10000, 1000000, 5000, euro(aankoop))}
        {veld(t("calc.eigenInbreng"), inbreng, setInbreng, 0, aankoop, 5000, euro(inbreng))}
        {veld(t("calc.rente"), rente, setRente, 1, 8, 0.1, `${rente}%`)}
        {veld(t("calc.looptijd"), jaar, setJaar, 5, 30, 1, `${jaar} ${t("calc.jaar")}`)}
      </div>
      <div className="mt-4 bg-[#FBEEE4] border border-[#F0D6C1] rounded-xl p-3 text-center">
        <div className="text-xs text-oranje-dk font-semibold uppercase tracking-wide">{t("calc.indicatie")}</div>
        <div className="font-display font-extrabold text-3xl text-oranje-dk">{euro(maand)}<span className="text-base font-semibold text-grijs"> {t("calc.pm")}</span></div>
        <div className="text-xs text-grijs mt-1">{t("calc.leenbedrag")} {euro(lening)} · {jaar} {t("calc.jaar")} · {rente}% {t("calc.rente").toLowerCase()}</div>
      </div>
      <a
        href={`/api/uit?partner=${encodeURIComponent("Samen Financieel Sterker")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-green w-full text-sm mt-3"
      >
        {t("calc.bereken")}
      </a>
      <p className="text-xs text-grijs mt-2">
        {t("calc.disclaimer")}
      </p>
    </div>
  );
}
