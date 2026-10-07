import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TIJDELIJK: toont het publieke uitgaande IP van deze app en vergelijkt met de
// door Kolibri gewhiteliste adressen. Na gebruik verwijderen. Gated met MYIP_KEY.
// Aanroepen: GET /api/cron/myip?key=MYIP_KEY
const WHITELIST = ["162.220.232.250", "152.55.177.181", "152.55.177.193"];

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!process.env.MYIP_KEY || key !== process.env.MYIP_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const bronnen = [
    "https://api.ipify.org?format=json",
    "https://ifconfig.co/json",
    "https://ipv4.icanhazip.com",
  ];
  const resultaten: any[] = [];
  for (const u of bronnen) {
    try {
      const r = await fetch(u, { cache: "no-store" });
      const t = (await r.text()).trim();
      let ip = t;
      try { const j = JSON.parse(t); ip = j.ip || j.address || ip; } catch {}
      resultaten.push({ bron: u, ip });
    } catch (e: any) {
      resultaten.push({ bron: u, error: String(e?.message || e) });
    }
  }
  const ips = Array.from(new Set(resultaten.map((r) => r.ip).filter(Boolean)));
  const controle = ips.map((ip) => ({ ip, gewhitelist: WHITELIST.includes(ip) }));
  const allesOk = ips.length > 0 && ips.every((ip) => WHITELIST.includes(ip));
  return NextResponse.json({
    ok: true,
    nu: new Date().toISOString(),
    regio: "sfo",
    whitelist: WHITELIST,
    gevondenUitgaandeIps: ips,
    controle,
    allesInWhitelist: allesOk,
    bronnen: resultaten,
  });
}
