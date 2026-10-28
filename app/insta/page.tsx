import Link from "next/link";
import { getSocialPosts, getListing, getListings } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { Listing, SocialPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Net op Instagram — Mooihuus",
  description: "De woningen die we net op onze Instagram deelden. Klik door naar de woning die je zocht.",
};

// Een post staat ECHT op het Instagram-grid als 'ie geplaatst is, of ingepland
// met een posttijd die al verstreken is (die is via autoPublish uitgegaan).
// 'wachtrij' (wel in de rij, nog niet uit) en 'mislukt' horen hier NIET bij —
// anders zou /insta woningen tonen die niet op Instagram staan (de oude drift).
function opHetGrid(s: SocialPost, nu: number): boolean {
  if (s.kanaal !== "instagram") return false;
  if (s.status === "geplaatst") return true;
  if (s.status === "ingepland") {
    const t = s.ingeplandVoor ? Date.parse(s.ingeplandVoor) : NaN;
    return Number.isFinite(t) ? t <= nu : false;
  }
  return false;
}

// Moment waarop de post op het grid kwam — voor "nieuwste bovenaan", net als IG.
function postTijd(s: SocialPost): string {
  return s.geplaatstOp || s.ingeplandVoor || s.aangemaakt;
}

export default function InstaPage() {
  const nu = Date.now();

  // Woningen in de volgorde van onze Instagram-posts (nieuwste bovenaan), ontdubbeld.
  // Bron van waarheid: alleen posts die daadwerkelijk op het grid staan.
  const gezien = new Set<string>();
  const woningen: Listing[] = [];
  const opGrid = getSocialPosts()
    .filter((s) => opHetGrid(s, nu))
    .sort((a, b) => postTijd(b).localeCompare(postTijd(a)));
  for (const s of opGrid) {
    if (gezien.has(s.listingId)) continue;
    const l = getListing(s.listingId);
    if (l && l.status === "live") {
      woningen.push(l);
      gezien.add(s.listingId);
    }
    if (woningen.length >= 12) break;
  }

  // Nog (bijna) niets op het grid? Vul aan met recente, live woningen (uitgelicht
  // eerst) zodat de link-in-bio-pagina nooit leeg is voor een bezoeker.
  if (woningen.length < 6) {
    const extra = getListings()
      .filter((l) => l.status === "live" && !gezien.has(l.id))
      .sort((a, b) => (b.uitgelicht ? 1 : 0) - (a.uitgelicht ? 1 : 0) || String(b.aangemaakt).localeCompare(String(a.aangemaakt)));
    for (const l of extra) {
      woningen.push(l);
      gezien.add(l.id);
      if (woningen.length >= 9) break;
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-7">
        <div className="inline-flex items-center gap-2 bg-bosgroen/10 text-bosgroen-dk rounded-full px-3 py-1 text-sm font-semibold">
          📸 Via onze Instagram
        </div>
        <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk mt-3">Welkom! Dit zocht je waarschijnlijk</h1>
        <p className="text-grijs mt-2 max-w-xl mx-auto">
          De woningen die we net op Instagram deelden staan hieronder — de nieuwste bovenaan. Klik door voor alle foto&rsquo;s,
          de plattegrond en de details.
        </p>
      </div>

      {woningen.length === 0 ? (
        <div className="text-center text-grijs py-10">
          Er staan nu even geen woningen klaar.{" "}
          <Link href="/" className="underline text-bosgroen-dk">
            Bekijk het volledige aanbod →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {woningen.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/" className="btn">
              Bekijk al het aanbod →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
