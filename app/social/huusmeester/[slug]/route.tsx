import { ImageResponse } from "next/og";
import { getHuusmeesterCategorie } from "@/lib/partners";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Merkgestileerde Instagram-postafbeelding (1080x1080) per Huusmeester-categorie.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const c = getHuusmeesterCategorie(params.slug);
  if (!c) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1080, display: "flex", flexDirection: "column", position: "relative", backgroundColor: "#1F4E32", fontFamily: "sans-serif", padding: 80 }}>
        <div style={{ position: "absolute", right: -120, bottom: -120, width: 460, height: 460, borderRadius: 999, backgroundColor: "#7CAE86", opacity: 0.3, display: "flex" }} />
        <div style={{ position: "absolute", left: -110, top: -120, width: 360, height: 360, borderRadius: 999, backgroundColor: "#E8823B", opacity: 0.22, display: "flex" }} />

        <div style={{ display: "flex", backgroundColor: "#ffffff", borderRadius: 999, padding: "14px 30px", fontSize: 40, fontWeight: 800, color: "#2C6B45", alignSelf: "flex-start" }}>
          Mooihuus<span style={{ color: "#E8823B" }}>.nl</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", color: "#ffffff" }}>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "#E8B77E", textTransform: "uppercase", letterSpacing: 3, marginBottom: 22 }}>
            Huusmeesters
          </div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1.05, marginBottom: 26 }}>{c.titel}</div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 500, color: "#DDECE0", lineHeight: 1.35 }}>{c.tekst}</div>
        </div>

        <div style={{ display: "flex", fontSize: 40, fontWeight: 600, color: "#E8B77E" }}>Regel het via mooihuus.nl/huusmeesters</div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
