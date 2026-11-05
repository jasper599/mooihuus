import { MOOIHUUS_URL, WOONHUUS_URL } from "@/lib/site";

// Uitlegpagina over het zusterplatform. Op Mooihuus.nl legt hij Woonhuus uit,
// op Woonhuus.nl legt hij Mooihuus uit. Beide platformen staan naast elkaar
// in hun eigen kleur, zodat het verschil in één oogopslag duidelijk is.
const G = { donker: "#1F4E32", mid: "#2C6B45", licht: "#C9E0CE", zacht: "#EEF5EF" };
const B = { donker: "#1E3A5F", mid: "#2B5283", licht: "#D5E0EC", zacht: "#EEF3F8" };

function Logo({ site }: { site: "mooihuus" | "woonhuus" }) {
  return site === "mooihuus" ? (
    <span className="font-display font-extrabold"><span style={{ color: "#7CAE86" }}>Mooi</span><span style={{ color: G.donker }}>huus</span><span style={{ color: "#E8823B" }}>.nl</span></span>
  ) : (
    <span className="font-display font-extrabold"><span style={{ color: B.mid }}>Woon</span><span style={{ color: "#1B2430" }}>huus</span><span style={{ color: "#E8823B" }}>.nl</span></span>
  );
}

export function PlatformUitleg({ hier }: { hier: "mooihuus" | "woonhuus" }) {
  const ander = hier === "mooihuus" ? "woonhuus" : "mooihuus";
  const A = ander === "woonhuus" ? B : G;
  const anderUrl = ander === "woonhuus" ? WOONHUUS_URL : MOOIHUUS_URL;
  const anderNaam = ander === "woonhuus" ? "Woonhuus.nl" : "Mooihuus.nl";

  const kop =
    ander === "woonhuus"
      ? { tag: "Ons zusterplatform", titel: "Woonhuus.nl: voor gewone koopwoningen", tekst: "Mooihuus is helemaal gericht op recreatiewoningen. Voor eengezinswoningen, appartementen en starterswoningen die te koop staan, hebben we Woonhuus.nl. Zelfde team, zelfde gemak, een eigen etalage." }
      : { tag: "Ons zusterplatform", titel: "Mooihuus.nl: voor recreatiewoningen", tekst: "Woonhuus is er voor gewone koopwoningen. Zoek je een plek om recreatief van te genieten, zoals een chalet, bungalow of vakantiehuis? Dan ben je bij Mooihuus.nl aan het goede adres, met begeleiding van advertentie tot contract." };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Kop */}
      <section className="rounded-3xl p-7 md:p-12 text-white relative overflow-hidden" style={{ background: A.donker }}>
        <div className="relative z-10 max-w-3xl">
          <div className="font-display font-semibold text-sm mb-2" style={{ color: A.licht }}>{kop.tag}</div>
          <h1 className="m-0 font-display font-extrabold text-3xl md:text-5xl leading-tight">{kop.titel}</h1>
          <p className="mt-4 mb-0 text-lg leading-relaxed" style={{ color: A.licht }}>{kop.tekst}</p>
          <a href={anderUrl} className="btn mt-6 text-base px-6 py-3">Naar {anderNaam} →</a>
        </div>
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
      </section>

      {/* Naast elkaar */}
      <section className="mt-10">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk text-center">Eén team, twee platformen</h2>
        <p className="text-grijs text-center mt-2 max-w-2xl mx-auto">Elke woning staat waar de juiste kopers zoeken. Zo ziet het verschil eruit.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[
            {
              site: "mooihuus" as const,
              K: G,
              wat: "Recreatiewoningen om recreatief van te genieten",
              voorbeelden: "Chalets, bungalows, tiny houses, vakantiehuizen en hele parken",
              punten: [
                "Kopen en huren",
                "Begeleiding van advertentie tot contract",
                "Huusmeesters: vakmensen rond je recreatiewoning",
                "Waardeindicaties en hulp bij teksten",
              ],
            },
            {
              site: "woonhuus" as const,
              K: B,
              wat: "Gewone woningen om permanent in te wonen",
              voorbeelden: "Eengezinswoningen, appartementen, starterswoningen en meer",
              punten: [
                "Alleen koopwoningen",
                "Wij bieden alleen de advertentie aan",
                "Van makelaars en particulieren",
                "Je reactie gaat direct naar de aanbieder",
              ],
            },
          ].map((p) => (
            <div key={p.site} className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: p.K.licht }}>
              <div className="px-6 py-4" style={{ background: p.K.zacht }}>
                <div className="text-xl"><Logo site={p.site} /></div>
                <div className="font-display font-semibold mt-1" style={{ color: p.K.donker }}>{p.wat}</div>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-grijs m-0">{p.voorbeelden}</p>
                <ul className="mt-4 space-y-2 list-none p-0">
                  {p.punten.map((pt) => (
                    <li key={pt} className="flex gap-2 items-start text-inkt">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={p.K.mid} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0"><path d="M20 6 9 17l-5-5" /></svg>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hoe werkt het */}
      <section className="mt-12">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-bosgroen-dk">Hoe werkt het?</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { n: "1", t: "Eén keer aansluiten", d: "Makelaars koppelen hun systeem (Kolibri of Realworks). Particulieren plaatsen hun woning zelf via Plaats je huus." },
            { n: "2", t: "Automatisch op de juiste plek", d: "Recreatiewoningen verschijnen op Mooihuus.nl, gewone koopwoningen op Woonhuus.nl. Dat gaat vanzelf, op basis van de gegevens van de woning." },
            { n: "3", t: "Eén account voor alles", d: "Inloggen, je woningen beheren, facturen en reacties: alles op één plek, via je account op Mooihuus.nl." },
          ].map((s) => (
            <div key={s.n} className="card">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-extrabold text-white" style={{ background: A.mid }}>{s.n}</div>
              <div className="font-display font-bold text-bosgroen-dk mt-3">{s.t}</div>
              <p className="text-sm text-grijs mt-1 mb-0">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Voor wie */}
      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { t: "Voor kopers", d: ander === "woonhuus" ? "Zoek je een gewone woning om in te wonen? Op Woonhuus.nl zoek, bewaar en vergelijk je gratis, zonder account." : "Zoek je een plek om tot rust te komen? Op Mooihuus.nl vind je recreatiewoningen in heel Nederland, te koop en te huur." },
          { t: "Voor makelaars", d: "Eén koppeling, twee platformen. Een vast bedrag per woning per jaar, zonder abonnement per maand. Op de factuur zie je per woning waar die staat." },
          { t: "Voor particulieren", d: "Plaats je woning zelf. Bij een recreatiewoning helpen we je verder als je vastloopt; bij een gewone woning bieden we de advertentie aan." },
        ].map((b) => (
          <div key={b.t} className="rounded-2xl p-5 border" style={{ background: A.zacht, borderColor: A.licht }}>
            <div className="font-display font-bold" style={{ color: A.donker }}>{b.t}</div>
            <p className="text-sm text-inkt mt-1 mb-0 leading-relaxed">{b.d}</p>
          </div>
        ))}
      </section>

      {/* Afsluiter */}
      <section className="mt-12 rounded-3xl p-7 md:p-10 flex flex-wrap gap-5 items-center border" style={{ background: A.zacht, borderColor: A.licht }}>
        <div className="flex-[1_1_380px]">
          <div className="text-2xl md:text-3xl"><Logo site={ander} /></div>
          <p className="mt-2 mb-0 text-grijs">
            {ander === "woonhuus" ? "Koopwoningen in heel Nederland, aangeboden door makelaars en particulieren." : "Recreatiewoningen in heel Nederland: kopen, huren of zelf aanbieden."}
          </p>
        </div>
        <a href={anderUrl} className="btn text-base px-6 py-3">Bekijk {anderNaam} →</a>
      </section>

      <p className="text-xs text-grijs mt-6">
        Mooihuus.nl en Woonhuus.nl zijn diensten van Huus B.V. De <a href="/voorwaarden" className="underline">voorwaarden</a>, <a href="/privacy" className="underline">privacyverklaring</a> en <a href="/disclaimer" className="underline">disclaimer</a> gelden voor beide platformen.
      </p>
    </div>
  );
}
