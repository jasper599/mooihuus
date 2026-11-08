import { bevestigGroeiMelding } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

// "Gezien"-knop uit de groeimail van Guus: daarna belt Guus niet meer over deze melding.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const ok = bevestigGroeiMelding(token);
  const tekst = ok
    ? "Dank je, Jasper. Guus belt je hier niet meer over."
    : "Deze link is niet (meer) geldig.";
  return new Response(
    `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mooihuus</title></head>` +
      `<body style="font-family:system-ui,sans-serif;background:#FBF8F1;color:#22302A;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px">` +
      `<div style="max-width:420px;background:#fff;border-radius:16px;padding:28px;text-align:center"><h1 style="font-size:22px;color:#1F4E32;margin:0 0 8px">${ok ? "Gezien" : "Oeps"}</h1><p>${tekst}</p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
