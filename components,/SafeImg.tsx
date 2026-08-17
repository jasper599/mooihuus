"use client";

import { useState } from "react";

// Toont een afbeelding, maar verbergt zichzelf netjes zodra de bron niet
// laadt (bijv. een externe foto-URL die offline is gehaald). De achterliggende
// gradient-placeholder blijft dan zichtbaar in plaats van een kapot "?"-icoon.
export function SafeImg({
  src,
  alt,
  className,
  loading,
  decoding,
  onClick,
}: {
  src?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  onClick?: () => void;
}) {
  const [dood, setDood] = useState(false);
  if (!src || dood) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onClick={onClick}
      onError={() => setDood(true)}
      className={className}
    />
  );
}
