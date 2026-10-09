"use client";

// Afbeelding op een woningkaart met een nette terugval: faalt de bron (een
// kapotte of verlopen externe foto-URL), dan verbergen we de <img> zodat de
// sfeervolle kleurachtergrond van de kaart zichtbaar blijft — geen lelijk
// "gebroken afbeelding"-icoon meer voor de bezoeker.
export function CardFoto({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
