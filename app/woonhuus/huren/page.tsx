import type { Metadata } from "next";
import { getLiveListings } from "@/lib/db";
import { ListingsBrowser } from "@/components/ListingsBrowser";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Huurwoningen in Nederland, rechtstreeks van de makelaar",
  description: "Appartementen en huurwoningen in heel Nederland, rechtstreeks van de makelaar. Filter op provincie, type en huurprijs per maand.",
  alternates: { canonical: "/huren" },
};

export default function WoonhuusHuren() {
  const listings = getLiveListings("woonhuis")
    .filter((l) => l.doel === "huur")
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined, omschrijving: "" }));
  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Huurwoningen</h1>
      <p className="text-grijs mt-2 max-w-2xl">Appartementen en huurwoningen in heel Nederland, rechtstreeks van de makelaar. Je reactie gaat direct naar de verhuurmakelaar.</p>
      <ListingsBrowser listings={listings} locale="nl" modus="huur" woonhuis />
    </div>
  );
}
