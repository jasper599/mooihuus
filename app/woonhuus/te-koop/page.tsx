import type { Metadata } from "next";
import Link from "next/link";
import { getLiveListings } from "@/lib/db";
import { PROVINCIES, provincieSlug } from "@/lib/provincies";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Huis te koop in Nederland, per provincie",
  description: "Bekijk koopwoningen per provincie: eengezinswoningen, appartementen en starterswoningen, van makelaars en particulieren.",
  alternates: { canonical: "/te-koop" },
};

export default function WoonhuusTeKoop() {
  const live = getLiveListings("woonhuis").filter((l) => l.doel === "koop");
  const perProv = (p: string) => live.filter((l) => l.provincie === p).length;
  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Huis te koop in Nederland</h1>
      <p className="text-grijs mt-2 max-w-2xl mb-6">Kies een provincie en bekijk de koopwoningen die makelaars en particulieren daar op Woonhuus.nl aanbieden.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROVINCIES.map((p) => (
          <Link key={p} href={`/te-koop/${provincieSlug(p)}`} className="card flex items-center justify-between hover:shadow-md transition-shadow">
            <span className="font-display font-bold text-bosgroen-dk">{p}</span>
            <span className="pill">{perProv(p)} {perProv(p) === 1 ? "woning" : "woningen"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
