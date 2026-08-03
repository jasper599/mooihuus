import type { Metadata } from "next";
import { ZoekForm } from "@/components/ZoekForm";

export const metadata: Metadata = {
  title: "Woning-alert — vind jouw recreatiewoning | Mooihuus",
  description:
    "Op zoek naar een recreatiewoning? Geef je wensen door en ontvang automatisch een mailtje zodra er een passende woning op Mooihuus verschijnt.",
  alternates: { canonical: "/zoeker" },
};

export default function ZoekerPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <span className="inline-block bg-salie-lt text-bosgroen-dk font-display font-semibold text-xs px-3 py-1 rounded-full">
        Voor kopers & huurders
      </span>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk mt-2">
        Op zoek naar je eigen huus?
      </h1>
      <p className="text-grijs mt-2">
        Laat weten wat je zoekt, dan houden wij het aanbod voor je in de gaten. Zodra er een woning
        bij komt die past bij jouw wensen, krijg je meteen een mailtje. Zo ben jij als eerste op de
        hoogte — helemaal gratis en vrijblijvend.
      </p>

      <div className="card mt-6">
        <h2 className="font-display font-bold text-lg text-bosgroen-dk mb-1">Stel je woning-alert in</h2>
        <p className="text-sm text-grijs mb-4">Vul in wat je zoekt. Je kunt velden leeglaten die er voor jou niet toe doen.</p>
        <ZoekForm />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mt-6 text-sm">
        <div className="card"><div className="text-2xl">🎯</div><div className="font-display font-bold text-bosgroen-dk mt-1">Op maat</div><div className="text-grijs">Alleen woningen die bij jouw wensen passen.</div></div>
        <div className="card"><div className="text-2xl">⚡</div><div className="font-display font-bold text-bosgroen-dk mt-1">Als eerste</div><div className="text-grijs">Meteen bericht bij een nieuwe match.</div></div>
        <div className="card"><div className="text-2xl">🤝</div><div className="font-display font-bold text-bosgroen-dk mt-1">Rechtstreeks</div><div className="text-grijs">Je reageert direct bij de aanbieder.</div></div>
      </div>
    </div>
  );
}
