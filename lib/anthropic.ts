// Kleine hulplaag voor de Anthropic-API. Vraagt de daadwerkelijk beschikbare
// modellen op (i.p.v. hardcoded namen die na verloop van tijd uitgefaseerd
// raken) en kiest er een passende. Zo blijft alles werken als Anthropic nieuwe
// modelversies uitbrengt. Resultaat wordt kort gecachet.

let cache: { modellen: string[]; tot: number } | null = null;

export async function beschikbareModellen(key: string, nuMs: number): Promise<string[]> {
  if (cache && cache.tot > nuMs) return cache.modellen;
  try {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    const ids: string[] = Array.isArray(data?.data)
      ? data.data.map((m: any) => m?.id).filter((x: any) => typeof x === "string")
      : [];
    if (ids.length) cache = { modellen: ids, tot: nuMs + 10 * 60 * 1000 };
    return ids;
  } catch {
    return [];
  }
}

// Kiest een model op voorkeur ("sonnet" voor kwaliteit, "haiku" voor snelheid/
// goedkoop). Valt terug op de andere klasse, dan op het eerste beschikbare model.
export function kiesModel(modellen: string[], voorkeur: "sonnet" | "haiku"): string | null {
  if (!modellen.length) return null;
  const bevat = (kw: string) => modellen.find((m) => m.toLowerCase().includes(kw));
  const ander = voorkeur === "sonnet" ? "haiku" : "sonnet";
  return bevat(voorkeur) || bevat(ander) || modellen[0];
}

// Bouwt een geordende lijst modellen om te proberen: env-override eerst, dan de
// voorkeur, dan de rest — allemaal gededupliceerd.
export function modelKandidaten(modellen: string[], voorkeur: "sonnet" | "haiku", envModel?: string): string[] {
  const lijst: string[] = [];
  if (envModel) lijst.push(envModel);
  const v = kiesModel(modellen, voorkeur);
  if (v) lijst.push(v);
  const a = kiesModel(modellen, voorkeur === "sonnet" ? "haiku" : "sonnet");
  if (a) lijst.push(a);
  for (const m of modellen) lijst.push(m);
  return Array.from(new Set(lijst));
}

// Robuuste aanroep van de Messages-API: probeert de beschikbare modellen op
// volgorde tot er één lukt. Geeft de tekst terug, of een reden bij falen. Zo
// werken vertaling/chat/huisregels net zo betrouwbaar als de blog-generator.
export async function vraagAnthropic(
  key: string,
  opts: {
    system: string;
    messages: { role: string; content: string }[];
    max_tokens: number;
    temperature?: number;
    voorkeur: "sonnet" | "haiku";
    envModel?: string;
    timeoutMs?: number;
    nuMs?: number;
  }
): Promise<{ text?: string; fout?: string; model?: string }> {
  const nuMs = opts.nuMs ?? Date.now();
  const modellen = await beschikbareModellen(key, nuMs);
  const kandidaten = modelKandidaten(modellen, opts.voorkeur, opts.envModel);
  if (!kandidaten.length) return { fout: "geen modellen beschikbaar via /v1/models" };

  const fouten: string[] = [];
  for (const model of kandidaten) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          max_tokens: opts.max_tokens,
          temperature: opts.temperature ?? 0.5,
          system: opts.system,
          messages: opts.messages,
        }),
      }).finally(() => clearTimeout(timer));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fouten.push(`${model}: HTTP ${res.status} ${(data?.error?.message || "").slice(0, 120)}`);
        continue;
      }
      const text = data?.content?.[0]?.text;
      if (typeof text === "string" && text.trim()) return { text, model };
      fouten.push(`${model}: lege respons`);
    } catch (e: any) {
      fouten.push(`${model}: ${e?.name === "AbortError" ? "time-out" : e?.message || "verbindingsfout"}`);
    }
  }
  return { fout: fouten.join(" | ") };
}
