import { ImageResponse } from "next/og";
import { getListing } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Automatische, merkgestileerde Instagram-postafbeelding (1080x1080) per woning.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l) return new Response("Not found", { status: 404 });

  const foto = l.fotos && l.fotos[0];
  const suffix = l.prijsSuffix && l.prijsSuffix !== "geen" ? l.prijsSuffix : l.doel === "koop" ? "k.k." : "";
  const prijs = "€ " + l.prijs.toLocaleString("nl-NL");

  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1080, display: "flex", position: "relative", backgroundColor: "#2C6B45", fontFamily: "sans-serif" }}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} width={1080} height={1080} style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1080, objectFit: "cover" }} />
        ) : null}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 560, display: "flex", background: "linear-gradient(to top, rgba(18,38,26,0.94), rgba(18,38,26,0.0))" }} />

        <div style={{ position: "absolute", top: 44, left: 44, display: "flex", backgroundColor: "#ffffff", borderRadius: 999, padding: "14px 30px", fontSize: 40, fontWeight: 800, color: "#2C6B45" }}>
          Mooihuus<span style={{ color: "#E8823B" }}>.nl</span>
        </div>
        <div style={{ position: "absolute", top: 48, right: 44, display: "flex", backgroundColor: "#E8823B", color: "#ffffff", borderRadius: 999, padding: "14px 30px", fontSize: 34, fontWeight: 700 }}>
          {l.doel === "huur" ? "Te huur" : "Te koop"}
        </div>

        <div style={{ position: "absolute", left: 56, right: 56, bottom: 64, display: "flex", flexDirection: "column", color: "#ffffff" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 600, marginBottom: 10, opacity: 0.92 }}>{l.type} · {l.park || l.provincie}</div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <span style={{ fontSize: 104, fontWeight: 800, lineHeight: 1 }}>{prijs}</span>
            {suffix ? <span style={{ fontSize: 48, fontWeight: 600, opacity: 0.85, marginLeft: 16, paddingBottom: 10 }}>{suffix}</span> : null}
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 600, marginTop: 12, opacity: 0.9 }}>{l.provincie} · {l.personen} pers · {l.m2} m2</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
