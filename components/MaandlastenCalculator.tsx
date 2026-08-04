"use client";

import { useState } from "react";

function euro(n: number): string {
  return "€ " + Math.round(n).toLocaleString("nl-NL");
}

export function MaandlastenCalculator({ prijs }: { prijs: number }) {
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
      <div className="font-display font-bold text-bosgroen-dk mb-1">Wat kost dit per maand?</div>
      <p className="text-xs text-grijs mb-3">Een indicatie van je bruto maandlasten bij een annuïteitenhypotheek.</p>
      <div className="space-y-3">
        {veld("Aankoopprijs", aankoop, setAankoop, 10000, 1000000, 5000, euro(aankoop))}
        {veld("Eigen inbreng", inbreng, setInbreng, 0, aankoop, 5000, euro(inbreng))}
        {veld("Rente", rente, setRente, 1, 8, 0.1, `${rente}%`)}
        {veld("Looptijd (jaar)", jaar, setJaar, 5, 30, 1, `${jaar} jaar`)}
      </div>
      <div className="mt-4 bg-[#FBEEE4] border border-[#F0D6C1] rounded-xl p-3 text-center">
        <div className="text-xs text-oranje-dk font-semibold uppercase tracking-wide">Indicatieve maandlast</div>
        <div className="font-display font-extrabold text-3xl text-oranje-dk">{euro(maand)}<span className="text-base font-semibold text-grijs"> p/m</span></div>
        <div className="text-xs text-grijs mt-1">Leenbedrag {euro(lening)} · {jaar} jaar · {rente}% rente</div>
      </div>
      <a
        href={`/api/uit?partner=${encodeURIComponent("Samen Financieel Sterker")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-green w-full text-sm mt-3"
      >
        Bereken je echte hypotheek bij onze partner →
      </a>
      <p className="text-xs text-grijs mt-2">
        Let op: dit is een vrijblijvende indicatie, geen hypotheekaanbod. Werkelijke maandlasten hangen af van je situatie, rentevorm en fiscale aftrek.
      </p>
    </div>
  );
}
