// Metricool-koppeling voor het inplannen van Instagram-posts.
//
// Gated achter env-variabelen — zonder credentials doet dit niets en blijft de
// post in de interne wachtrij staan (die je in de backoffice ziet, met voorrang
// voor betaalde 'Social spotlight'-bestellingen).
//
// Benodigde env-variabelen (uit je Metricool-account, Settings → API):
//   METRICOOL_USER_TOKEN  — je persoonlijke API-token
//   METRICOOL_USER_ID     — je Metricool user id
//   METRICOOL_BLOG_ID     — het id van het merk/blog (de Instagram-connectie)
//
// De exacte endpoint/velden kunnen per Metricool-API-versie verschillen; pas
// PAD/BODY zo nodig aan wanneer je de koppeling activeert.

export function metricoolEnabled(): boolean {
  return !!(process.env.METRICOOL_USER_TOKEN && process.env.METRICOOL_BLOG_ID && process.env.METRICOOL_USER_ID);
}

export type MetricoolResultaat = { ok: boolean; id?: string; error?: string };

// Bepaalt het eerstvolgende geschikte plaatsings-moment.
// Prioriteit → zo snel mogelijk (over ~15 min); anders morgenochtend 10:00.
export function volgendeSlot(prioriteit: boolean, vanaf = new Date()): string {
  const d = new Date(vanaf.getTime());
  if (prioriteit) {
    d.setMinutes(d.getMinutes() + 15);
  } else {
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
  }
  return d.toISOString();
}

export async function scheduleInstagramPost(opts: {
  tekst: string;
  fotoUrl?: string;
  publishAt: string; // ISO
}): Promise<MetricoolResultaat> {
  if (!metricoolEnabled()) return { ok: false, error: "Metricool niet geconfigureerd" };

  const token = process.env.METRICOOL_USER_TOKEN!;
  const userId = process.env.METRICOOL_USER_ID!;
  const blogId = process.env.METRICOOL_BLOG_ID!;

  const url =
    `https://app.metricool.com/api/v2/scheduler/posts` +
    `?userId=${encodeURIComponent(userId)}&blogId=${encodeURIComponent(blogId)}`;

  const body = {
    providers: [{ network: "instagram" }],
    publicationDate: { dateTime: opts.publishAt, timezone: "Europe/Amsterdam" },
    text: opts.tekst,
    media: opts.fotoUrl ? [opts.fotoUrl] : [],
    autoPublish: true,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Mc-Auth": token },
      signal: controller.signal,
      body: JSON.stringify(body),
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return { ok: false, error: `Metricool ${res.status}` };
    const data = await res.json().catch(() => ({}));
    return { ok: true, id: data?.id ? String(data.id) : undefined };
  } catch (e: any) {
    return { ok: false, error: e?.name === "AbortError" ? "Time-out" : "Verbindingsfout" };
  }
}
