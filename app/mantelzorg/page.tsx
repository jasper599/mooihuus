import type { Metadata } from "next";
import { MantelzorgCheck } from "@/components/MantelzorgCheck";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mantelzorgwoning in je tuin? Doe de vergunningscheck | Mooihuus",
  description:
    "Check in een paar vragen of je een mantelzorgwoning vergunningvrij in je tuin mag plaatsen. Gratis, indicatief en direct resultaat — daarna helpen we je graag verder.",
  alternates: { canonical: "/mantelzorg" },
};

export default function MantelzorgPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <span className="inline-block bg-salie-lt text-bosgroen-dk font-display font-semibold text-xs px-3 py-1 rounded-full">Mantelzorg</span>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk mt-2">Een mantelzorgwoning in je tuin?</h1>
      <p className="text-grijs mt-2 max-w-xl">
        Een dierbare dichtbij, maar toch ieder z'n eigen plek. In veel gevallen mag een mantelzorgwoning
        zelfs <strong className="text-bosgroen-dk">vergunningvrij</strong> in de tuin. Doe de gratis check en
        weet binnen een minuut waar je aan toe bent.
      </p>

      <div className="mt-6">
        <MantelzorgCheck />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { t: "In 1 minuut", s: "Een paar korte vragen en je hebt een indicatie." },
          { t: "Op de landelijke regels", s: "Gebaseerd op de eisen voor vergunningvrij bouwen." },
          { t: "Hulp bij plaatsing", s: "Kansrijk? Wij denken graag met je mee." },
        ].map((c) => (
          <div key={c.t} className="card">
            <div className="font-display font-bold text-bosgroen-dk text-sm">{c.t}</div>
            <div className="text-sm text-grijs mt-0.5">{c.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
