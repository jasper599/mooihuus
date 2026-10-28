import { ImageResponse } from "next/og";
import { getListing } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Korte, nette titel voor op de kaart (de volle titel kan lang zijn).
function korteTitel(titel: string): string {
  const eerste = (titel || "").split(/[–—\-,|]/)[0].trim();
  const t = eerste || (titel || "").trim();
  return t.length > 48 ? t.slice(0, 47).trim() + "…" : t;
}

// Automatische, merkgestileerde Instagram-postafbeelding (1080x1350) per woning.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l) return new Response("Not found", { status: 404 });

  const foto = l.fotos && l.fotos[0];
  const suffix = l.prijsSuffix && l.prijsSuffix !== "geen" ? l.prijsSuffix : l.doel === "koop" ? "k.k." : "";
  const prijs = "€ " + l.prijs.toLocaleString("nl-NL") + (suffix ? " " + suffix : "");
  const titel = korteTitel(l.titel);
  const meta = [l.provincie, l.personen ? `${l.personen} pers` : "", l.m2 ? `${l.m2} m²` : ""].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1350, display: "flex", position: "relative", backgroundColor: "#0a140e", fontFamily: "sans-serif" }}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} width={1080} height={1350} style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, objectFit: "cover" }} />
        ) : null}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 780, display: "flex", background: "linear-gradient(to top, rgba(8,18,12,0.95), rgba(8,18,12,0.0))" }} />

        <div style={{ position: "absolute", top: 48, left: 48, display: "flex", backgroundColor: "#1F4E32", borderRadius: 999, padding: "16px 30px", fontSize: 36, fontWeight: 700, color: "#ffffff" }}>
          Nieuw op Mooihuus
        </div>
        <div style={{ position: "absolute", top: 48, right: 48, display: "flex", backgroundColor: "#ffffff", color: "#1F4E32", borderRadius: 999, padding: "16px 30px", fontSize: 32, fontWeight: 800 }}>
          {l.doel === "huur" ? "Te huur" : "Te koop"}
        </div>

        <div style={{ position: "absolute", left: 56, right: 56, bottom: 56, display: "flex", flexDirection: "column", color: "#ffffff" }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", backgroundColor: "#E8823B", color: "#ffffff", borderRadius: 18, padding: "16px 30px", fontSize: 46, fontWeight: 800, marginBottom: 28 }}>{prijs}</div>
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 800, lineHeight: 1.05, marginBottom: 16 }}>{titel}</div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 500, opacity: 0.95, marginBottom: 40 }}>{meta}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "rgba(255,255,255,0.34)", paddingTop: 32 }}>
            <div style={{ display: "flex", fontSize: 50, fontWeight: 800 }}>
              <span style={{ color: "#7CAE86" }}>Mooi</span>
              <span style={{ color: "#ffffff" }}>huus</span>
              <span style={{ color: "#E8823B" }}>.nl</span>
            </div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#ffffff", borderWidth: 2, borderStyle: "solid", borderColor: "rgba(255,255,255,0.6)", borderRadius: 999, padding: "14px 28px" }}>Bekijk op mooihuus.nl →</div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
