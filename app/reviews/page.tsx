import type { Metadata } from "next";
import { getReviews } from "@/lib/db";
import { Sterren } from "@/components/Sterren";
import { ReviewForm } from "@/components/ReviewForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Beoordelingen — wat anderen van Mooihuus vinden",
  description: "Ervaringen van kopers, verkopers en verhuurders van recreatiewoningen op Mooihuus.",
};

function datumKort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function ReviewsPage() {
  const reviews = getReviews();
  const gem = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Beoordelingen ⭐</h1>
      <p className="text-grijs mb-6">Wat kopers, verkopers en verhuurders van Mooihuus vinden.</p>

      {reviews.length > 0 && (
        <div className="card mb-6 flex items-center gap-4 flex-wrap">
          <div className="font-display font-extrabold text-4xl text-oranje-dk leading-none">{gem.toFixed(1)}</div>
          <div>
            <Sterren rating={gem} className="text-xl" />
            <div className="text-sm text-grijs mt-1">Gemiddeld uit {reviews.length} {reviews.length === 1 ? "beoordeling" : "beoordelingen"}</div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_1fr] items-start">
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="card text-grijs">Nog geen beoordelingen. Wees de eerste die zijn ervaring deelt!</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display font-bold text-bosgroen-dk">
                    {r.naam}
                    {r.plaats && <span className="text-grijs font-normal font-sans text-sm"> · {r.plaats}</span>}
                  </div>
                  <Sterren rating={r.rating} />
                </div>
                <p className="text-sm mt-1.5 leading-relaxed">{r.tekst}</p>
                <div className="text-xs text-grijs mt-2">{datumKort(r.datum)}</div>
              </div>
            ))
          )}
        </div>
        <ReviewForm />
      </div>
    </div>
  );
}
