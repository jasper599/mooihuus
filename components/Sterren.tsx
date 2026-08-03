export function Sterren({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex ${className}`} aria-label={`${rating} van 5 sterren`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "text-oranje" : "text-lijn"}>
          ★
        </span>
      ))}
    </span>
  );
}
