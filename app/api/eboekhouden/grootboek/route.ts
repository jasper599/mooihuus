import { NextResponse } from "next/server";
import { leesGrootboekrekeningen, eboekhoudenEnabled } from "@/lib/eboekhouden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Toont de grootboekrekeningen uit de Huus B.V.-administratie, zodat je de
// juiste "Omzet advertenties"-rekening kunt opzoeken en op EB_OMZET_LEDGER
// kunt zetten. Read-only; beveiligd met CRON_SECRET. Vereist
// EBOEKHOUDEN_MOOIHUUS_TOKEN.
//   Alles   : /api/eboekhouden/grootboek?key=CRON_SECRET
//   Zoeken  : /api/eboekhouden/grootboek?key=CRON_SECRET&zoek=advert
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!eboekhoudenEnabled()) {
    return NextResponse.json({
      ok: true,
      actief: false,
      bericht:
        "Zet EBOEKHOUDEN_MOOIHUUS_TOKEN in de Mooihuus-variabelen om het grootboekschema te kunnen lezen.",
      rekeningen: [],
    });
  }
  try {
    const zoek = url.searchParams.get("zoek") || undefined;
    const rekeningen = await leesGrootboekrekeningen(zoek);
    return NextResponse.json({
      ok: true,
      actief: true,
      zoek: zoek || null,
      aantal: rekeningen.length,
      huidige_omzet_ledger: (process.env.EB_OMZET_LEDGER || "8000").trim(),
      rekeningen,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
