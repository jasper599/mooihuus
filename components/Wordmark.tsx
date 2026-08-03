export function RoofMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M16 4 L29 15 L25 15 L25 28 L7 28 L7 15 L3 15 Z" fill="#2C6B45" />
      <rect x="13.5" y="19" width="5" height="9" fill="#E8823B" />
    </svg>
  );
}

export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold inline-flex items-center gap-1 ${className}`}>
      <RoofMark className="w-[1.1em] h-[1.1em] mr-1" />
      <span className="text-salie">Mooi</span>
      <span className="text-bosgroen-dk">huus</span>
      <span className="text-oranje font-bold">.nl</span>
    </span>
  );
}
