import type { Metadata } from "next";
import { getLiveListings } from "@/lib/db";
import { getLocale } from "@/lib/i18n-server";
import { FavorietenList } from "@/components/FavorietenList";
import { huidigeSite } from "@/lib/site-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mijn favorieten",
  description: "De woningen die je hebt bewaard.",
};

export default function FavorietenPage() {
  const locale = getLocale();
  const listings = getLiveListings(huidigeSite() === "woonhuus" ? "woonhuis" : "recreatie").map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined }));

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Mijn favorieten ❤️</h1>
      <p className="text-grijs mb-6">Je bewaarde woningen staan op dit apparaat. Log niet nodig — ze blijven bewaard in je browser.</p>
      <FavorietenList listings={listings} locale={locale} />
    </div>
  );
}
