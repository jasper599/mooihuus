// ------------------------------------------------------------------
// AI virtuele styling van interieurfoto's via Replicate.
//
// Gebruikt een interieur-model dat de bestaande ruimte (muren, ramen, indeling)
// behoudt en alleen de styling/aankleding vervangt volgens de gekozen sfeer.
// Standaardmodel: adirik/interior-design (instelbaar via REPLICATE_MODEL).
//
// Beveiliging/kosten: dit draait alleen als REPLICATE_API_TOKEN is gezet en
// AI_STYLING_UIT niet "1" is. De aanroeper (de API-route) checkt daarnaast de
// per-gebruiker- en dag-limieten.
// ------------------------------------------------------------------

export interface Stijl {
  key: string;
  label: string;
  prompt: string;
}

export const STIJLEN: Stijl[] = [
  { key: "modern", label: "Modern", prompt: "a modern interior, clean lines, contemporary furniture, warm neutral tones, tasteful decor, professionally styled, photorealistic, natural lighting" },
  { key: "landelijk", label: "Landelijk", prompt: "a cozy Dutch country-style (landelijk) interior, natural wood, warm rustic furniture, soft textiles, inviting, photorealistic, natural lighting" },
  { key: "scandinavisch", label: "Scandinavisch", prompt: "a Scandinavian interior, light wood, white walls, minimalist cozy furniture, bright and airy, photorealistic, natural lighting" },
  { key: "modern-luxe", label: "Modern luxe", prompt: "a modern luxury interior, elegant furniture, refined materials, sophisticated lighting, high-end styling, photorealistic" },
  { key: "licht-fris", label: "Licht & fris", prompt: "a light and fresh interior, bright natural light, airy neutral palette, subtle greenery, clean and inviting, photorealistic" },
];

const MODEL = process.env.REPLICATE_MODEL || "adirik/interior-design";
const NEG = "lowres, watermark, text, distorted, blurry, extra walls, changed architecture, deformed windows, cartoon";

export function stylingBeschikbaar(): boolean {
  return !!process.env.REPLICATE_API_TOKEN && process.env.AI_STYLING_UIT !== "1";
}

async function replicate(pad: string, init: RequestInit): Promise<any> {
  const res = await fetch(`https://api.replicate.com/v1/${pad}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || `Replicate gaf HTTP ${res.status}`);
  return data;
}

// Genereert een gestylede versie van de foto. `imageDataUri` is een
// "data:image/...;base64,..."-string. Geeft de (tijdelijke) URL van het
// resultaat op Replicate terug.
export async function genereerStyling(imageDataUri: string, stijlKey: string): Promise<string> {
  const stijl = STIJLEN.find((s) => s.key === stijlKey) || STIJLEN[0];
  let pred = await replicate(`models/${MODEL}/predictions`, {
    method: "POST",
    headers: { Prefer: "wait=55" }, // Replicate wacht tot ~55s op het resultaat
    body: JSON.stringify({
      input: {
        image: imageDataUri,
        prompt: stijl.prompt,
        negative_prompt: NEG,
        guidance_scale: 15,
        prompt_strength: 0.8,
        num_inference_steps: 30,
      },
    }),
  });

  // Voor de zekerheid nog even doorpollen als 'wait' nog niet klaar was.
  const start = Date.now();
  while (pred?.status && !["succeeded", "failed", "canceled"].includes(pred.status)) {
    if (Date.now() - start > 90000) throw new Error("Het genereren duurde te lang.");
    await new Promise((r) => setTimeout(r, 2500));
    pred = await replicate(`predictions/${pred.id}`, { method: "GET" });
  }
  if (pred.status !== "succeeded") throw new Error(pred?.error || "Het genereren is mislukt.");

  const out = Array.isArray(pred.output) ? pred.output[pred.output.length - 1] : pred.output;
  if (!out || typeof out !== "string") throw new Error("Geen resultaat ontvangen van het model.");
  return out;
}
