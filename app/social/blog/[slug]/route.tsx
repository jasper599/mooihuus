import { ImageResponse } from "next/og";
import { getBlogPost } from "@/lib/blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Merkgestileerde Instagram-postafbeelding (1080x1080) per blogartikel.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const p = getBlogPost(params.slug);
  if (!p) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1080, display: "flex", flexDirection: "column", position: "relative", backgroundColor: "#2C6B45", fontFamily: "sans-serif", padding: 80 }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 420, height: 420, borderRadius: 999, backgroundColor: "#7CAE86", opacity: 0.35, display: "flex" }} />
        <div style={{ position: "absolute", left: -100, bottom: -140, width: 360, height: 360, borderRadius: 999, backgroundColor: "#E8823B", opacity: 0.25, display: "flex" }} />

        <div style={{ display: "flex", backgroundColor: "#ffffff", borderRadius: 999, padding: "14px 30px", fontSize: 40, fontWeight: 800, color: "#2C6B45", alignSelf: "flex-start" }}>
          Mooihuus<span style={{ color: "#E8823B" }}>.nl</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", color: "#ffffff" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#DDECE0", textTransform: "uppercase", letterSpacing: 2, marginBottom: 20 }}>
            Blog · {p.categorie}
          </div>
          <div style={{ display: "flex", fontSize: 78, fontWeight: 800, lineHeight: 1.1 }}>{p.titel}</div>
        </div>

        <div style={{ display: "flex", fontSize: 40, fontWeight: 600, color: "#DDECE0" }}>Lees meer via de link in onze bio</div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
