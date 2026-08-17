import { ImageResponse } from "next/og";
import { getListing } from "@/lib/db";
import { euro, prijsSuffix, gradient } from "@/lib/format";

export const runtime = "nodejs";
export const alt = "Woning op Mooihuus.nl";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamische, gebrande deel-afbeelding per woning. Verschijnt automatisch als
// preview wanneer een woninglink wordt gedeeld op WhatsApp, Facebook, X, enz.
export default async function OG({ params }: { params: { id: string } }) {
  const l = getListing(params.id);
  const bg = gradient(l?.kleur ?? 0);
  const badge = !l ? "" : l.status === "verkocht" ? "VERKOCHT" : l.doel === "huur" ? "TE HUUR" : "TE KOOP";
  const titel = l?.titel || "Recreatiewoning";
  const sub = l ? [l.type, l.park, l.provincie].filter(Boolean).join("  ·  ") : "Hét platform voor recreatiewoningen";
  const prijs = l?.prijs ? `${euro(l.prijs)}${prijsSuffix(l) ? " " + prijsSuffix(l) : ""}` : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: bg, padding: 56, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 800, color: "#fff" }}>
            <span style={{ marginRight: 14, fontSize: 40 }}>🏡</span>
            <span>Mooi</span><span style={{ color: "#1F4E32" }}>huus</span><span style={{ color: "#E8823B" }}>.nl</span>
          </div>
          {badge ? (
            <div style={{ background: l && l.status === "verkocht" ? "#E8823B" : "#2C6B45", color: "#fff", fontSize: 26, fontWeight: 700, padding: "8px 22px", borderRadius: 999 }}>{badge}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", background: "#FBF8F1", borderRadius: 28, padding: 40 }}>
          <div style={{ fontSize: 30, color: "#6B7A70", marginBottom: 10 }}>{sub}</div>
          <div style={{ fontSize: 58, fontWeight: 800, color: "#1F4E32", lineHeight: 1.05 }}>{titel}</div>
          {prijs ? <div style={{ fontSize: 46, fontWeight: 800, color: "#C9691F", marginTop: 18 }}>{prijs}</div> : null}
        </div>
      </div>
    ),
    size
  );
}
