"use client";

import Link from "next/link";
import { Listing } from "@/lib/types";
import { Locale, localeHref } from "@/lib/i18n";
import { ListingCard } from "./ListingCard";
import { useFavorites } from "./useFavorites";

export function FavorietenList({ listings, locale = "nl" }: { listings: Listing[]; locale?: Locale }) {
  const { favs } = useFavorites();
  const mijn = listings.filter((l) => favs.includes(l.id));

  if (favs.length === 0) {
    return (
      <div className="card text-grijs">
        Je hebt nog geen woningen bewaard. Tik op het hartje{" "}
        <span className="align-middle">🤍</span> bij een woning om hem hier terug te vinden.
        <div className="mt-3">
          <Link href={localeHref(locale, "/")} className="btn btn-green text-sm">Bekijk het aanbod</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="text-sm text-grijs">{mijn.length} bewaarde {mijn.length === 1 ? "woning" : "woningen"}</div>
        {mijn.length > 1 && <Link href={localeHref(locale, "/vergelijken")} className="btn btn-ghost text-sm">⚖️ Vergelijken</Link>}
      </div>
      {mijn.length === 0 ? (
        <div className="card text-grijs">Je bewaarde woningen zijn niet meer beschikbaar (verkocht of offline).</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mijn.map((l) => (
            <ListingCard key={l.id} listing={l} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
