// ------------------------------------------------------------------
// AI virtuele styling van interieurfoto's via de Gemini-beeld-API (Google).
//
// Het model bewerkt een bestaande kamerfoto: het behoudt de architectuur/indeling
// (muren, ramen, camerastandpunt) en vervangt alleen de aankleding volgens de
// gekozen stijl. Model is instelbaar via GEMINI_MODEL, zodat we kunnen bijsturen
// zonder de code opnieuw te uploaden.
//
// Beveiliging/kosten: draait alleen met GEMINI_API_KEY en als AI_STYLING_UIT niet
// "1" is. De API-route checkt daarnaast de per-gebruiker- en dag-limieten.
// ------------------------------------------------------------------

export interface Stijl {
  key: string;
  label: string;
  prompt: string;
}

// De 3 stijlen voor recreatiewoningen: strak, knus, en licht/ruimtelijk.
export const STIJLEN: Stijl[] = [
  { key: "modern", label: "Modern", prompt: "een moderne, strakke en eigentijdse inrichting met warme neutrale tinten, nette meubels en smaakvolle decoratie" },
  { key: "landelijk", label: "Landelijk", prompt: "een warme, gezellige landelijke inrichting met natuurlijk hout, zachte textiel en een knusse vakantiesfeer" },
  { key: "scandinavisch", label: "Licht & Scandinavisch", prompt: "een lichte, frisse Scandinavische inrichting met licht hout, witte wanden, minimalistische meubels en veel ruimtelijkheid" },
];

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview";

export function stylingBeschikbaar(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.AI_STYLING_UIT !== "1";
}

// Genereert een gestylede versie van de foto. `imageDataUri` is een
// "data:image/...;base64,..."-string. Geeft het gegenereerde beeld terug als
// base64 + mime-type.
export async function genereerStyling(imageDataUri: string, stijlKey: string): Promise<{ base64: string; mime: string }> {
  const stijl = STIJLEN.find((s) => s.key === stijlKey) || STIJLEN[0];

  const m = imageDataUri.match(/^data:([^;]+);base64,([\s\S]+)$/);
  const inMime = m ? m[1] : "image/jpeg";
  const inData = m ? m[2] : imageDataUri;

  const prompt =
    `Herstyle het interieur op deze foto naar ${stijl.prompt}. ` +
    `Behoud EXACT de architectuur, de indeling, de ramen, deuren en het camerastandpunt van de originele foto — ` +
    `verander alleen de meubels, kleuren, materialen en aankleding. Fotorealistisch resultaat, geen tekst of watermerk.`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: inMime, data: inData } },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      }
    );
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Gemini gaf HTTP ${res.status}`);

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const beeld = parts.find((p: any) => (p.inlineData?.data || p.inline_data?.data));
    const inline = beeld?.inlineData || beeld?.inline_data;
    if (!inline?.data) throw new Error("Geen beeld ontvangen van het model.");
    return { base64: inline.data as string, mime: (inline.mimeType || inline.mime_type || "image/png") as string };
  } finally {
    clearTimeout(timer);
  }
}
