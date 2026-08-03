"use client";

import { useFavorites } from "./useFavorites";

export function FavButton({ id, variant = "overlay" }: { id: string; variant?: "overlay" | "inline" }) {
  const { isFav, toggle } = useFavorites();
  const actief = isFav(id);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={actief}
        className={`btn text-sm ${actief ? "btn-green" : "btn-ghost"}`}
      >
        {actief ? "❤️ Opgeslagen" : "🤍 Bewaar deze woning"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actief ? "Uit favorieten" : "Bewaar als favoriet"}
      aria-pressed={actief}
      className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-lg shadow-sm hover:bg-white transition-colors"
    >
      {actief ? "❤️" : "🤍"}
    </button>
  );
}
