const gradients = [
  "linear-gradient(135deg,#9CC7A5,#5F9A72)",
  "linear-gradient(135deg,#E8B77E,#D89A55)",
  "linear-gradient(135deg,#A9CBB4,#7CAE86)",
  "linear-gradient(135deg,#8FB6A0,#5F9A72)",
  "linear-gradient(135deg,#EBC08A,#D89A55)",
  "linear-gradient(135deg,#B7D3BE,#7CAE86)",
];

export function gradient(i: number): string {
  return gradients[i % gradients.length];
}

export function euro(n: number): string {
  return "€ " + n.toLocaleString("nl-NL");
}

// Standaard prijs-toevoeging. Koop zonder eigen keuze → "k.k.", huur → "".
export function prijsSuffix(listing: { prijsSuffix?: string; doel: string }): string {
  if (typeof listing.prijsSuffix === "string" && listing.prijsSuffix.trim() && listing.prijsSuffix !== "geen") {
    return listing.prijsSuffix.trim();
  }
  return listing.doel === "koop" ? "k.k." : "";
}

// Classificeer de grondsituatie voor een duidelijke badge.
// Geeft null terug als er niets bekend is.
export function grondInfo(grond?: string): { label: string; eigen: boolean } | null {
  if (!grond || !grond.trim()) return null;
  const g = grond.toLowerCase();
  const eigen = g.includes("eigen");
  const huur = g.includes("erfpacht") || g.includes("huur") || g.includes("pacht");
  if (eigen && !huur) return { label: "Eigen grond", eigen: true };
  if (huur) return { label: grond.trim(), eigen: false };
  // Onbekende formulering: toon zoals opgegeven, neutraal behandeld als niet-eigen.
  return { label: grond.trim(), eigen: false };
}
