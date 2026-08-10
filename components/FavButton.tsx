"use client";

import { useFavorites } from "./useFavorites";
import { useT } from "./I18nProvider";

export function FavButton({ id, variant = "overlay" }: { id: string; variant?: "overlay" | "inline" }) {
  const t = useT();
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
        {actief ? `❤️ ${t("fav.opgeslagen")}` : `🤍 ${t("fav.bewaar")}`}
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
