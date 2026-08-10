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
