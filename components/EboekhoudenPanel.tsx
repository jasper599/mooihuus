"use client";

import { useState } from "react";

type Resultaat = {
  ok: boolean;
  dry: boolean;
  actief: boolean;
  aantalKandidaten: number;
  geboekt: number;
  rekening?: string;
  voorstellen: { paymentId: string; factuurnummer: string; klant: string; bedragInclBtw: number; datum: string; actie: string }[];
  fouten: { paymentId: string; fout: string }[];
  error?: string;
};

const euro = (n: number) => `€ ${Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Beheer: koppeling met e-Boekhouden (administratie Huus B.V.).
export function EboekhoudenPanel({ actief, auto, nogTeBoeken }: { actief: boolean; auto: boolean; nogTeBoeken: number }) {
  const [bezig, setBezig] = useState(false);
  const [res, setRes] = useState<Resultaat | null>(null);

  async function draai(dry: boolean) {
    if (!dry && !window.confirm("Weet je het zeker? De facturen worden echt in e-Boekhouden geboekt.")) return;
    setBezig(true);
    setRes(null);
    try {
      const r = await fetch("/api/beheer/eboekhouden", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dry }) });
      setRes(await r.json());
    } catch (e: any) {
      setRes({ ok: false, dry, actief, aantalKandidaten: 0, geboekt: 0, voorstellen: [], fouten: [], error: String(e?.message || e) });
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="card mb-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <div className="font-display font-bold text-bosgroen-dk">Boekhouding (e-Boekhouden)</div>
          <div className="text-sm text-grijs mt-0.5">
            {actief ? (
              <>Koppeling actief. {auto ? "Betaalde facturen worden elke dag automatisch geboekt." : "Automatisch boeken staat nog uit."} Nog te boeken: <strong>{nogTeBoeken}</strong>.</>
            ) : (
              <>Nog niet gekoppeld. Zet de API-token van Huus B.V. in Railway als <code>EBOEKHOUDEN_MOOIHUUS_TOKEN</code>. Nog te boeken: <strong>{nogTeBoeken}</strong>.</>
            )}
          </div>
        </div>
        <button type="button" disabled={bezig} onClick={() => draai(true)} className="btn btn-ghost text-sm disabled:opacity-50">Proefronde</button>
        <button type="button" disabled={bezig || !actief} onClick={() => draai(false)} className="btn text-sm disabled:opacity-40">Nu boeken</button>
      </div>
      {bezig && <div className="text-sm text-grijs mt-3">Bezig…</div>}
      {res && (
        <div className="mt-4 text-sm">
          {res.error ? (
            <div className="text-red-700">Fout: {res.error}</div>
          ) : (
            <>
              <div className="mb-2">
                {res.dry ? "Proefronde" : "Geboekt"}: {res.dry ? `${res.aantalKandidaten} facturen zouden geboekt worden` : `${res.geboekt} van ${res.aantalKandidaten} facturen geboekt`}
                {res.rekening && <span> · omzetrekening <strong>{res.rekening}</strong></span>}
                {res.fouten.length > 0 && <span className="text-red-700"> · {res.fouten.length} fout(en)</span>}
              </div>
              <div className="max-h-72 overflow-auto border border-lijn rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-zand"><tr><th className="text-left p-2">Factuur</th><th className="text-left p-2">Klant</th><th className="text-left p-2">Datum</th><th className="text-right p-2">Bedrag</th><th className="text-left p-2">Actie</th></tr></thead>
                  <tbody>
                    {res.voorstellen.map((v) => (
                      <tr key={v.paymentId} className="border-t border-lijn"><td className="p-2">{v.factuurnummer}</td><td className="p-2">{v.klant}</td><td className="p-2">{v.datum}</td><td className="p-2 text-right">{euro(v.bedragInclBtw)}</td><td className="p-2">{v.actie}</td></tr>
                    ))}
                    {res.fouten.map((f) => (
                      <tr key={f.paymentId} className="border-t border-lijn text-red-700"><td className="p-2" colSpan={5}>{f.paymentId}: {f.fout}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
