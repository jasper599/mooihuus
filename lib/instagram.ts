// Directe Instagram-plaatsing via de Meta / Instagram Graph API.
//
// Vereist twee omgevingsvariabelen:
//   IG_ACCESS_TOKEN  — een (long-lived) toegangstoken met instagram_basic + instagram_content_publish
//   IG_BUSINESS_ID   — het Instagram Business Account-ID (gekoppeld aan een Facebook-pagina)
//
// De foto moet via een publieke URL bereikbaar zijn (onze woningfoto's staan publiek op mooihuus.nl).

const GRAPH = "https://graph.facebook.com/v21.0";

export function instagramEnabled(): boolean {
  return !!(process.env.IG_ACCESS_TOKEN && process.env.IG_BUSINESS_ID);
}

export type InstagramResultaat = { ok: boolean; id?: string; error?: string };

export async function postToInstagram(opts: { imageUrl?: string; caption: string }): Promise<InstagramResultaat> {
  if (!instagramEnabled()) return { ok: false, error: "Instagram niet geconfigureerd" };
  if (!opts.imageUrl) return { ok: false, error: "Geen foto beschikbaar" };
  const token = process.env.IG_ACCESS_TOKEN!;
  const ig = process.env.IG_BUSINESS_ID!;
  try {
    // 1) Media-container aanmaken.
    const createBody = new URLSearchParams({ image_url: opts.imageUrl, caption: opts.caption || "", access_token: token });
    const c1 = new AbortController();
    const t1 = setTimeout(() => c1.abort(), 20000);
    const createRes = await fetch(`${GRAPH}/${ig}/media`, { method: "POST", body: createBody, signal: c1.signal });
    clearTimeout(t1);
    const createData: any = await createRes.json().catch(() => ({}));
    if (!createRes.ok || !createData?.id) {
      return { ok: false, error: createData?.error?.message || `container ${createRes.status}` };
    }
    const creationId = String(createData.id);

    // 2) Publiceren.
    const pubBody = new URLSearchParams({ creation_id: creationId, access_token: token });
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 20000);
    const pubRes = await fetch(`${GRAPH}/${ig}/media_publish`, { method: "POST", body: pubBody, signal: c2.signal });
    clearTimeout(t2);
    const pubData: any = await pubRes.json().catch(() => ({}));
    if (!pubRes.ok || !pubData?.id) {
      return { ok: false, error: pubData?.error?.message || `publish ${pubRes.status}` };
    }
    return { ok: true, id: String(pubData.id) };
  } catch (e: any) {
    return { ok: false, error: e?.name === "AbortError" ? "Time-out" : "Verbindingsfout" };
  }
}
