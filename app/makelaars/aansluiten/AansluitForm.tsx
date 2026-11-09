"use client";
import { useEffect, useState } from "react";

// Aanmeldformulier voor Realworks-kantoren: de makelaar plakt de API-sleutel
// die hij in Realworks heeft aangemaakt.
export function AansluitForm() {
  const [ts, setTs] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [klaar, setKlaar] = useState<null | { werkt: boolean; aantal?: number }>(null);
  useEffect(() => setTs(Date.now()), []);

  async function verstuur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFout("");
    setBezig(true);
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f.entries());
    try {
      const res = await fetch("/api/makelaars/aansluiten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ts }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setFout(j.error || "Er ging iets mis. Probeer het opnieuw of mail ons.");
      else setKlaar({ werkt: !!j.werkt, aantal: j.aantal });
    } catch {
      setFout("Er ging iets mis. Probeer het opnieuw of mail ons.");
    } finally {
      setBezig(false);
    }
  }

  if (klaar) {
    return (
      <div className="rounded-2xl border border-salie bg-salie/10 p-6">
        <div className="font-display font-bold text-lg text-bosgroen-dk">Dank u wel, uw kantoor is aangemeld!</div>
        <p className="text-sm mt-2 mb-0">
          {klaar.werkt
            ? `De koppeling werkt: we zien ${klaar.aantal ?? 0} actieve objecten. Binnen een uur staan uw woningen klaar en ontvangt u een mail met uw inloggegevens. Uw eerste 5 woningen zetten we gratis online.`
            : "We hebben uw sleutel ontvangen, maar konden nog geen verbinding maken. Soms duurt het even voordat Realworks een nieuwe sleutel vrijgeeft. We kijken ernaar en nemen binnen één werkdag contact met u op."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Naam kantoor
        <input name="kantoor" required className="field font-normal" placeholder="Bijv. Veluwe Makelaars" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Uw naam
        <input name="contactNaam" required className="field font-normal" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        E-mail (voor facturen en inloggegevens)
        <input name="email" type="email" required className="field font-normal" placeholder="info@uwkantoor.nl" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        <span>Telefoon <span className="font-normal text-grijs">(optioneel)</span></span>
        <input name="telefoon" type="tel" className="field font-normal" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-2">
        API-sleutel uit Realworks
        <input name="token" required autoComplete="off" spellCheck={false} className="field font-mono font-normal" placeholder="Plak hier de sleutel" />
        <span className="font-normal text-xs text-grijs">We gebruiken de sleutel alleen om uw aanbod op te halen. U kunt hem in Realworks altijd weer intrekken.</span>
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {fout && <div className="sm:col-span-2 text-sm text-red-700">{fout}</div>}
      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={bezig} className="btn text-base px-6 py-3">{bezig ? "Bezig met controleren..." : "Kantoor aansluiten"}</button>
        <span className="text-xs text-grijs">Door aan te sluiten gaat u akkoord met onze <a href="/voorwaarden" className="underline">algemene voorwaarden</a>.</span>
      </div>
    </form>
  );
}
