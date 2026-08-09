"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { suggestUitjes } from "@/lib/uitjes";

type Doel = "koop" | "huur";
const pakketten = [
  { naam: "Basis", prijs: "€ 25", sub: "eenmalig · 1 jaar online", feats: ["Tot 12 foto's", "AI-basistekst", "Leads direct naar jou"] },
  { naam: "Plus", prijs: "€ 49", sub: "eenmalig", feats: ["20 foto's + plattegrond", "Volledige AI-assistent", "Hoger in resultaten", "Contracthulp"], feat: true },
  { naam: "Premium", prijs: "€ 79", sub: "eenmalig", feats: ["Uitgelicht op de homepage", "Je woning als voorbeeld in onze marketing & ad-banners", "Voorrang bij de Huusmeesters"] },
];

const PROVINCIES = [
  "Groningen", "Friesland", "Drenthe", "Overijssel", "Flevoland", "Gelderland",
  "Utrecht", "Noord-Holland", "Zuid-Holland", "Zeeland", "Noord-Brabant", "Limburg",
];

export default function Plaatsen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [pakket, setPakket] = useState("Plus");
  const [f, setF] = useState({
    doel: "koop" as Doel,
    type: "Chalet",
    provincie: "Drenthe",
    personen: "4",
    m2: "65",
    prijs: "89000",
    prijsSuffix: "",
    grond: "",
    park: "Park De Veluwe",
    postcode: "",
    videoUrl: "",
  });
  const [uitjes, setUitjes] = useState<string[]>([]);
  const [uitjeInput, setUitjeInput] = useState("");
  function addUitje(v: string) {
    const w = v.trim();
    if (w && !uitjes.includes(w)) setUitjes([...uitjes, w]);
    setUitjeInput("");
  }
  function suggest() {
    const s = suggestUitjes(f.provincie);
    setUitjes((cur) => Array.from(new Set([...cur, ...s])));
  }
  const [ai, setAi] = useState<{ titel: string; omschrijving: string; prijsindicatie: string } | null>(null);
  const [titel, setTitel] = useState("");
  const [omschrijving, setOmschrijving] = useState("");

  async function genereer() {
    setBusy(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const data = await res.json();
    setAi(data);
    setTitel(data.titel);
    setOmschrijving(data.omschrijving);
    setBusy(false);
  }

  const [fout, setFout] = useState("");

  async function publiceer() {
    setBusy(true);
    setFout("");
    const res = await fetch("/api/plaatsen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel: titel || `${f.type} in ${f.provincie}`,
        type: f.type,
        doel: f.doel,
        provincie: f.provincie,
        park: f.park,
        personen: Number(f.personen),
        m2: Number(f.m2),
        prijs: Number(f.prijs),
        prijsSuffix: f.prijsSuffix,
        grond: f.grond,
        videoUrl: f.videoUrl,
        omschrijving,
        pakket,
        postcode: f.postcode,
        uitjes,
      }),
    });
    if (res.status === 401) {
      router.push("/inloggen");
      return;
    }
    const data = await res.json();
    if (!res.ok || data.error || !data.redirect) {
      setFout(data.error || "Er ging iets mis bij het plaatsen. Probeer het opnieuw.");
      setBusy(false);
      return;
    }
    if (data.extern) {
      window.location.href = data.redirect;
    } else {
      router.push(data.redirect);
    }
  }

  const steps = ["Basis", "AI-tekst", "Foto's", "Pakket"];

  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Plaats je huus</h1>
      <p className="text-grijs mb-5">In een paar stappen online — de AI helpt je op weg.</p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`flex-1 min-w-[110px] text-center text-xs font-semibold rounded-[10px] px-2 py-2 border ${
              step === i + 1
                ? "bg-bosgroen text-white border-bosgroen"
                : step > i + 1
                ? "bg-salie-lt text-bosgroen-dk border-salie-lt"
                : "bg-white text-grijs border-lijn"
            }`}
          >
            {i + 1} · {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card grid gap-3 sm:grid-cols-2">
          <Field label="Aanbieden als">
            <select className="field" value={f.doel} onChange={(e) => setF({ ...f, doel: e.target.value as Doel })}>
              <option value="koop">Te koop</option>
              <option value="huur">Te huur</option>
            </select>
          </Field>
          <Field label="Type woning">
            <select className="field" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option>Chalet</option><option>Bungalow</option><option>Tiny house</option><option>Vrijstaand vakantiehuis</option>
            </select>
          </Field>
          <Field label="Provincie">
            <select className="field" value={f.provincie} onChange={(e) => setF({ ...f, provincie: e.target.value })}>
              {PROVINCIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Aantal personen"><input className="field" value={f.personen} onChange={(e) => setF({ ...f, personen: e.target.value })} /></Field>
          <Field label="Woonoppervlak (m²)"><input className="field" value={f.m2} onChange={(e) => setF({ ...f, m2: e.target.value })} /></Field>
          <Field label="Vraagprijs (€)"><input className="field" value={f.prijs} onChange={(e) => setF({ ...f, prijs: e.target.value })} /></Field>
          <Field label="Prijs-toevoeging">
            <select className="field" value={f.prijsSuffix} onChange={(e) => setF({ ...f, prijsSuffix: e.target.value })}>
              <option value="">Automatisch (koop → k.k.)</option>
              <option value="k.k.">k.k. (kosten koper)</option>
              <option value="v.o.n.">v.o.n. (vrij op naam)</option>
              <option value="excl. btw">excl. btw</option>
              <option value="per week">per week</option>
              <option value="per maand">per maand</option>
              <option value="geen">Geen toevoeging</option>
            </select>
          </Field>
          <Field label="Grond">
            <select className="field" value={f.grond} onChange={(e) => setF({ ...f, grond: e.target.value })}>
              <option value="">Onbekend / niet tonen</option>
              <option value="Eigen grond">Eigen grond</option>
              <option value="Erfpacht">Erfpacht</option>
              <option value="Huurgrond">Huurgrond</option>
            </select>
          </Field>
          <Field label="Recreatiepark"><input className="field" value={f.park} onChange={(e) => setF({ ...f, park: e.target.value })} /></Field>
          <Field label="Postcode"><input className="field" value={f.postcode} onChange={(e) => setF({ ...f, postcode: e.target.value })} placeholder="1234 AB" /></Field>
          <div className="sm:col-span-2"><Field label="Video / rondleiding (optioneel — YouTube, Vimeo of Matterport)"><input className="field" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} placeholder="https://youtu.be/… of Matterport-link" /></Field></div>
          <div className="sm:col-span-2 text-right"><button className="btn" onClick={() => setStep(2)}>Volgende →</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <p className="font-semibold">De AI schrijft een titel en omschrijving in de Mooihuus-stijl.</p>
          <button className="btn btn-green mt-3" onClick={genereer} disabled={busy}>
            {busy ? "Bezig…" : "✨ Genereer tekst"}
          </button>
          {ai && (
            <>
              <div className="bg-[#EAF4EC] border border-[#CADFCF] rounded-xl p-3.5 mt-3">
                <div className="font-display font-bold text-bosgroen-dk text-sm">✨ AI-voorstel — pas gerust aan</div>
              </div>
              <label className="label">Titel</label>
              <input className="field" value={titel} onChange={(e) => setTitel(e.target.value)} />
              <label className="label">Omschrijving</label>
              <textarea className="field min-h-[120px]" value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} />
              <div className="bg-[#FBEEE4] border border-[#F0D6C1] rounded-xl p-3.5 mt-3">
                <div className="font-display font-bold text-oranje-dk text-sm">💶 Prijsindicatie (Huuswaarde)</div>
                <div className="text-sm mt-1">{ai.prijsindicatie}</div>
              </div>
            </>
          )}
          <div className="flex justify-between mt-4">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Terug</button>
            <button className="btn" onClick={() => setStep(3)}>Volgende →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <p className="font-semibold">Voeg foto's toe. De AI adviseert de sterkste openingsfoto.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div className="h-20 rounded-[10px] relative" style={{ background: "linear-gradient(135deg,#9CC7A5,#5F9A72)" }}>
              <span className="absolute bottom-1 left-1 bg-oranje text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded font-display">AI: beste opener</span>
            </div>
            <div className="h-20 rounded-[10px]" style={{ background: "linear-gradient(135deg,#E8B77E,#D89A55)" }} />
            <div className="h-20 rounded-[10px]" style={{ background: "linear-gradient(135deg,#A9CBB4,#7CAE86)" }} />
            <div className="h-20 rounded-[10px] bg-creme border-2 border-dashed border-salie flex items-center justify-center text-grijs text-sm">+ upload</div>
          </div>
          <div className="bg-[#EAF4EC] border border-[#CADFCF] rounded-xl p-3.5 mt-3 text-sm">
            ✅ Volledigheidscheck: nog aan te vullen zijn energielabel en een plattegrond.
          </div>

          <div className="mt-5">
            <div className="font-semibold text-sm">Uitjes in de buurt</div>
            <p className="text-xs text-grijs mb-2">Voeg leuke uitjes toe zodat je woning opvalt. Gebruik de suggesties op basis van je postcode/provincie, of voeg zelf toe.</p>
            <div className="flex gap-2">
              <input
                className="field"
                value={uitjeInput}
                onChange={(e) => setUitjeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUitje(uitjeInput); } }}
                placeholder="bijv. Nationaal Park De Hoge Veluwe"
              />
              <button type="button" onClick={() => addUitje(uitjeInput)} className="btn btn-green text-sm px-3">Toevoegen</button>
            </div>
            <button type="button" onClick={suggest} className="text-xs text-bosgroen font-semibold mt-2">✨ Suggesties op basis van locatie ({f.provincie})</button>
            {uitjes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {uitjes.map((u) => (
                  <span key={u} className="pill inline-flex items-center gap-1">
                    {u}
                    <button type="button" onClick={() => setUitjes(uitjes.filter((x) => x !== u))} className="text-bosgroen-dk">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Terug</button>
            <button className="btn" onClick={() => setStep(4)}>Volgende →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <p className="font-semibold mb-3">Kies je pakket — eenmalig, al vanaf € 25.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {pakketten.map((p) => (
              <button
                key={p.naam}
                onClick={() => setPakket(p.naam)}
                className={`text-left card relative ${p.feat ? "border-oranje" : ""} ${pakket === p.naam ? "outline outline-2 outline-bosgroen" : ""}`}
              >
                {p.feat && <span className="absolute -top-2.5 right-3 bg-oranje text-white font-display font-semibold text-[0.68rem] px-2.5 py-0.5 rounded-full">Populair</span>}
                <div className="font-display font-bold text-bosgroen-dk text-lg">{p.naam}</div>
                <div className="font-display font-extrabold text-xl">{p.prijs} <span className="text-xs text-grijs font-medium">{p.sub}</span></div>
                <ul className="mt-2 space-y-1">
                  {p.feats.map((ft) => (
                    <li key={ft} className="text-sm pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-bosgroen before:font-bold">{ft}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <div className="card mt-3">
            <div className="font-semibold text-sm mb-2">Losse opvallers (later bij te kopen)</div>
            <span className="pill mr-1">Omhoog € 1,95</span>
            <span className="pill mr-1">Dagtopper € 2,95</span>
            <span className="pill mr-1">Blikvanger € 4,95</span>
            <span className="pill">Social spotlight € 9,95</span>
          </div>
          <div className="bg-[#EAF4EC] border border-[#CADFCF] rounded-xl p-3 mt-3 text-sm text-bosgroen-dk">
            🏷️ <strong>Volumekorting:</strong> vanaf 5 objecten krijg je automatisch 15% korting, vanaf 10 objecten 25% — handig voor organisaties en parken.
          </div>
          {fout && (
            <div className="bg-[#FBE9E7] border border-[#E5B4AB] text-[#8A2E22] rounded-xl p-3 mt-3 text-sm whitespace-pre-line">
              {fout}
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <button className="btn btn-ghost" onClick={() => setStep(3)}>← Terug</button>
            <button className="btn" onClick={publiceer} disabled={busy}>
              {busy ? "Bezig…" : "Betaal met iDEAL & plaats →"}
            </button>
          </div>
          <p className="text-xs text-grijs mt-2">
            Door je huus te plaatsen ga je akkoord met onze{" "}
            <a href="/voorwaarden" className="underline text-bosgroen">algemene voorwaarden en huisregels</a>.
          </p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
