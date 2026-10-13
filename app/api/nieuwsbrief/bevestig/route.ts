import { bevestigNieuwsbrief } from "@/lib/db";
import { COMPANY } from "@/lib/company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pagina(titel: string, tekst: string): Response {
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel} — Mooihuus</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#F4F1EC; color:#2F3A34; }
  .wrap { max-width:520px; margin:12vh auto; padding:0 20px; text-align:center; }
  .card { background:#fff; border-radius:16px; padding:32px 24px; box-shadow:0 2px 14px rgba(0,0,0,.06); }
  h1 { font-size:22px; margin:0 0 10px; color:#2F4A3C; }
  p { font-size:15px; line-height:1.5; margin:0 0 8px; color:#44524A; }
  a { display:inline-block; margin-top:18px; color:#2F4A3C; font-weight:600; text-decoration:none; }
</style></head><body><div class="wrap"><div class="card">
<h1>${titel}</h1><p>${tekst}</p>
<a href="${COMPANY.website}">Naar Mooihuus.nl</a>
</div></div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!token) {
    return pagina("Ongeldige link", "Deze bevestigingslink is niet compleet. Meld je gerust opnieuw aan.");
  }
  const res = bevestigNieuwsbrief(token);
  if (res.ok) {
    return pagina("Je bent aangemeld! 🎉", "Bedankt, je aanmelding voor de Mooihuus-nieuwsbrief is bevestigd. Je ontvangt voortaan onze updates.");
  }
  return pagina("Link verlopen of al gebruikt", "Deze bevestigingslink is niet meer geldig (verlopen of al eens gebruikt). Meld je gerust opnieuw aan, dan sturen we een nieuwe bevestiging.");
}
