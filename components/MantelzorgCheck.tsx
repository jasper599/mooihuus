"use client";

import { useState } from "react";

// Indicatieve vergunningscheck voor een mantelzorgwoning. Volledig client-side
// (beslisboom op basis van de landelijke regels voor vergunningvrij bouwen).
// De uitkomst is een indicatie; de gemeente beslist definitief. Onderaan kan de
// bezoeker vrijblijvend advies aanvragen — die lead komt via /api/contact binnen.

type Ans = Record<string, string | number>;
type Q = {
  key: string; step: string; title: string; help: string;
  type: "choice" | "num"; unit?: string; ph?: string;
  options?: { v: string; t: string }[]; cond?: (a: Ans) => boolean;
};

const STEPS: Q[] = [
  { key: "zorg", step: "Vraag 1", title: "Is er een mantelzorgrelatie?", help: "Er moet iemand mantelzorg geven of ontvangen. Een zorgindicatie of mantelzorgverklaring is meestal nodig.", type: "choice", options: [{ v: "ja", t: "Ja, er is (of komt) een zorgrelatie" }, { v: "nee", t: "Nee, geen zorgrelatie" }] },
  { key: "kom", step: "Vraag 2", title: "Waar staat de woning?", help: "Binnen of buiten de bebouwde kom. Buiten gelden andere regels (verplaatsbare unit tot 100 m²).", type: "choice", options: [{ v: "binnen", t: "Binnen de bebouwde kom" }, { v: "buiten", t: "Buiten de bebouwde kom" }] },
  { key: "erf", step: "Vraag 3", title: "Komt de woning in het achtererfgebied?", help: "Achter de voorgevel van je huis — dus in de achtertuin, niet in de voortuin.", type: "choice", options: [{ v: "ja", t: "Ja, in de achtertuin / achtererf" }, { v: "nee", t: "Nee, (deels) in de voortuin" }, { v: "weet", t: "Weet ik niet zeker" }] },
  { key: "vorm", step: "Vraag 4", title: "Aangebouwd of vrijstaand?", help: "Vast aan het huis (binnen 4 m) of los in de tuin.", type: "choice", options: [{ v: "vrij", t: "Vrijstaand in de tuin" }, { v: "aan", t: "Aangebouwd aan het huis" }] },
  { key: "maat", step: "Vraag 5", title: "Hoe groot moet de woning worden?", help: "De gewenste oppervlakte van de mantelzorgwoning in vierkante meter.", type: "num", unit: "m²", ph: "bijv. 45" },
  { key: "hoog", step: "Vraag 6", title: "Wat wordt de bouwhoogte?", help: "De hoogte van het dak in meters.", type: "num", unit: "m", ph: "bijv. 3" },
];
const EXTRA: Q[] = [
  { key: "erfm2", step: "Nog even dit", title: "Hoe groot is je achtererfgebied?", help: "De oppervlakte van je achtertuin in m² (schatting is prima).", type: "num", unit: "m²", ph: "bijv. 150", cond: (a) => a.kom === "binnen" },
  { key: "bebouwd", step: "Laatste vraag", title: "Hoeveel m² is al bebouwd?", help: "Bestaande schuur, tuinhuis of aanbouw in het achtererf. Niets? Vul 0 in.", type: "num", unit: "m²", ph: "bijv. 20", cond: (a) => a.kom === "binnen" },
  { key: "verpl", step: "Nog even dit", title: "Wordt het een verplaatsbare unit?", help: "Buiten de bebouwde kom mag een verplaatsbare mantelzorgunit tot 100 m².", type: "choice", cond: (a) => a.kom === "buiten", options: [{ v: "ja", t: "Ja, verplaatsbaar" }, { v: "nee", t: "Nee, vast bouwwerk" }] },
];

function maxBijbehorend(b: number) {
  if (b <= 100) return 0.5 * b;
  if (b <= 300) return 50 + 0.2 * (b - 100);
  return Math.min(90 + 0.1 * (b - 300), 150);
}

type R = { type: "ok" | "at" | "no"; txt: string };

export function MantelzorgCheck() {
  const [answers, setAnswers] = useState<Ans>({});
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  const list: Q[] = [...STEPS, ...EXTRA.filter((e) => e.cond!(answers))];
  const q = list[idx];

  function set(k: string, v: string | number) { setAnswers((a) => ({ ...a, [k]: v })); }
  const valid = q ? !(answers[q.key] === undefined || answers[q.key] === "" || (q.type === "num" && isNaN(Number(answers[q.key])))) : false;

  function bereken(): { verdict: string; cls: "good" | "warn" | "bad"; lbl: string; reasons: R[] } {
    const a = answers; const reasons: R[] = []; let red = 0, amber = 0;
    const add = (type: R["type"], txt: string) => { reasons.push({ type, txt }); if (type === "no") red++; if (type === "at") amber++; };
    if (a.zorg === "ja") add("ok", "Er is een zorgrelatie — de basisvoorwaarde voor een mantelzorgwoning.");
    else add("no", "Zonder mantelzorgrelatie geldt de vergunningvrije regeling niet. Dan is een reguliere vergunning nodig.");
    if (a.erf === "ja") add("ok", "De woning komt in het achtererfgebied — dat is de juiste plek.");
    else if (a.erf === "nee") add("no", "In de voortuin / vóór de voorgevel mag het niet vergunningvrij.");
    else add("at", "Locatie op het erf is nog onzeker — laat de voorgevelrooilijn even nakijken.");
    if (a.kom === "binnen") {
      const beb = Number(a.erfm2) || 0, al = Number(a.bebouwd) || 0;
      const besch = Math.max(0, maxBijbehorend(beb) - al); const gew = Number(a.maat) || 0;
      if (gew <= besch) add("ok", `Met ~${Math.round(besch)} m² ruimte in het achtererf past ${gew} m² binnen de vergunningvrije maat.`);
      else add("no", `De gewenste ${gew} m² is groter dan de ~${Math.round(besch)} m² die hier vergunningvrij mag. Voor het meerdere is een vergunning nodig.`);
    } else {
      if (a.verpl === "ja" && (Number(a.maat) || 0) <= 100) add("ok", "Buiten de bebouwde kom mag een verplaatsbare unit tot 100 m² — dat past.");
      else if (a.verpl !== "ja") add("no", "Buiten de bebouwde kom moet de unit verplaatsbaar zijn om vergunningvrij te mogen.");
      else add("no", "Buiten de bebouwde kom geldt een maximum van 100 m² voor de verplaatsbare unit.");
    }
    const h = Number(a.hoog) || 0;
    if (a.vorm === "vrij") {
      if (h <= 3) add("ok", "De hoogte blijft binnen de 3 m voor een vrijstaand bouwwerk.");
      else if (h <= 5) add("at", "Tussen 3 en 5 m kan het, maar alleen met de juiste dakvorm.");
      else add("no", "Hoger dan 5 m is niet vergunningvrij.");
    } else {
      if (h <= 4) add("ok", "Voor een aanbouw is deze hoogte doorgaans akkoord.");
      else add("at", "Voor een hoge aanbouw gelden extra eisen (max. 30 cm boven de verdiepingsvloer).");
    }
    add("at", "Na afloop van de mantelzorg moet de woning weer worden verwijderd.");
    if (red > 0) return { verdict: "Waarschijnlijk een vergunning nodig", cls: "bad", lbl: "Let op", reasons };
    if (amber > 0) return { verdict: "Waarschijnlijk mogelijk — met aandachtspunten", cls: "warn", lbl: "Kansrijk", reasons };
    return { verdict: "Waarschijnlijk vergunningvrij", cls: "good", lbl: "Goed nieuws", reasons };
  }

  function restart() { setAnswers({}); setIdx(0); setDone(false); }

  if (done) return <Uitkomst result={bereken()} answers={answers} onRestart={restart} />;

  const segClass = (i: number) => `h-1.5 flex-1 rounded-full ${i <= idx ? "bg-bosgroen" : "bg-lijn"}`;
  return (
    <div className="card">
      <div className="flex gap-1.5 mb-5">{list.map((_, i) => <div key={i} className={segClass(i)} />)}</div>
      <div className="text-xs font-display font-semibold uppercase tracking-wider text-oranje-dk mb-2">{q.step} van {list.length}</div>
      <h2 className="font-display font-extrabold text-xl text-bosgroen-dk leading-snug">{q.title}</h2>
      <p className="text-grijs text-sm mt-1 mb-4">{q.help}</p>

      {q.type === "choice" ? (
        <div className="flex flex-col gap-2.5">
          {q.options!.map((o) => {
            const sel = answers[q.key] === o.v;
            return (
              <button key={o.v} onClick={() => set(q.key, o.v)} className={`flex items-center gap-3 text-left rounded-xl border-[1.5px] px-4 py-3.5 transition-colors ${sel ? "border-bosgroen bg-salie-lt" : "border-lijn bg-creme hover:border-salie"}`}>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? "border-bosgroen" : "border-lijn"}`}>{sel && <span className="w-2.5 h-2.5 rounded-full bg-bosgroen" />}</span>
                <span className="text-inkt">{o.t}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <input type="number" min={0} inputMode="numeric" className="field flex-1" placeholder={q.ph} value={answers[q.key] ?? ""} onChange={(e) => set(q.key, e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value)))} />
          <span className="text-grijs">{q.unit}</span>
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} className={`btn btn-ghost ${idx === 0 ? "invisible" : ""}`}>← Vorige</button>
        <button disabled={!valid} onClick={() => { if (idx < list.length - 1) setIdx(idx + 1); else setDone(true); }} className="btn disabled:opacity-40 disabled:cursor-not-allowed">
          {idx === list.length - 1 ? "Bekijk uitkomst →" : "Volgende →"}
        </button>
      </div>
    </div>
  );
}

function Uitkomst({ result, answers, onRestart }: { result: ReturnType<any>; answers: Ans; onRestart: () => void }) {
  const { verdict, cls, lbl, reasons } = result as { verdict: string; cls: "good" | "warn" | "bad"; lbl: string; reasons: R[] };
  const kleur = cls === "good" ? "bg-salie-lt border-bosgroen" : cls === "warn" ? "bg-[#FBEEDD] border-oranje" : "bg-[#F8E7E1] border-[#C24A2C]";
  const lblKleur = cls === "good" ? "text-bosgroen" : cls === "warn" ? "text-oranje-dk" : "text-[#C24A2C]";
  const mk = (t: R["type"]) => t === "ok" ? "✓" : t === "at" ? "!" : "×";
  const mkKleur = (t: R["type"]) => t === "ok" ? "bg-bosgroen" : t === "at" ? "bg-oranje" : "bg-[#C24A2C]";

  return (
    <div className="card">
      <div className={`rounded-2xl border p-5 ${kleur}`}>
        <div className={`text-xs font-display font-semibold uppercase tracking-wider ${lblKleur}`}>{lbl}</div>
        <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk mt-1">{verdict}</h2>
      </div>
      <div className="flex flex-col gap-2.5 mt-4">
        {reasons.map((r, i) => (
          <div key={i} className="flex gap-3 items-start text-sm">
            <span className={`w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${mkKleur(r.type)}`}>{mk(r.type)}</span>
            <span className="text-inkt">{r.txt}</span>
          </div>
        ))}
      </div>

      <AdviesForm answers={answers} verdict={verdict} />

      <div className="text-xs text-grijs mt-5 p-3.5 bg-creme border border-dashed border-lijn rounded-xl">
        <strong className="text-bosgroen-dk">Let op — dit is een indicatie, geen officiële toets.</strong> De uitkomst is gebaseerd op de landelijke regels voor vergunningvrij bouwen. Gemeenten kunnen aanvullende of afwijkende regels hebben (bijv. bij beschermd stads- of dorpsgezicht). De gemeente en het Omgevingsloket beslissen definitief.
      </div>
      <div className="mt-4"><button onClick={onRestart} className="btn btn-ghost text-sm">↺ Opnieuw invullen</button></div>
    </div>
  );
}

function AdviesForm({ answers, verdict }: { answers: Ans; verdict: string }) {
  const [f, setF] = useState({ naam: "", email: "", telefoon: "", plaats: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function verstuur(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const overzicht = Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join("\n");
    const bericht = `Adviesaanvraag mantelzorgwoning-check\n\nIndicatie: ${verdict}\nPlaats: ${f.plaats || "—"}\nTelefoon: ${f.telefoon || "—"}\n\nIngevulde check:\n${overzicht}`;
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ naam: f.naam, email: f.email, onderwerp: "Mantelzorg-adviesaanvraag", categorie: "Mantelzorg", regio: f.plaats, bericht }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Er ging iets mis."); setBusy(false); return; }
      setDone(true);
    } catch { setErr("Er ging iets mis. Probeer het opnieuw."); setBusy(false); }
  }

  if (done) return <div className="mt-5 bg-salie-lt text-bosgroen-dk rounded-xl p-4 text-sm font-semibold">✓ Bedankt! We nemen contact met je op om de mogelijkheden te bespreken.</div>;

  return (
    <div className="mt-5 bg-bosgroen text-white rounded-2xl p-5">
      <div className="font-display font-bold text-lg">Persoonlijk advies?</div>
      <p className="text-salie-lt text-sm mt-1 mb-3">Laat je gegevens achter, dan nemen we vrijblijvend contact op om de mogelijkheden te bespreken.</p>
      <form onSubmit={verstuur} className="grid gap-2.5 sm:grid-cols-2">
        <input required value={f.naam} onChange={(e) => setF({ ...f, naam: e.target.value })} placeholder="Je naam" className="field text-inkt" />
        <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Je e-mailadres" className="field text-inkt" />
        <input value={f.telefoon} onChange={(e) => setF({ ...f, telefoon: e.target.value })} placeholder="Telefoon (optioneel)" className="field text-inkt" />
        <input value={f.plaats} onChange={(e) => setF({ ...f, plaats: e.target.value })} placeholder="Plaats" className="field text-inkt" />
        {err && <p className="text-sm text-white/90 sm:col-span-2">{err}</p>}
        <button type="submit" disabled={busy} className="btn bg-white text-bosgroen-dk hover:bg-white/90 sm:col-span-2">{busy ? "Versturen…" : "Vraag advies aan"}</button>
      </form>
    </div>
  );
}
