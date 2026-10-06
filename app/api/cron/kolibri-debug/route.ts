import { NextResponse } from "next/server";
import { getAllMediaContracts, getSummariesForRealtor, getProperty } from "@/lib/kolibri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tijdelijke read-only diagnose: zoekt in een echt Kolibri-pand waar het
// e-mailadres van het makelaarskantoor zit. Beschermd met KOLIBRI_DEBUG_KEY.
// Plaatst niets en wijzigt niets. Aanroepen: /api/cron/kolibri-debug?key=...
function vindEmails(obj: any, pad: string, uit: { pad: string; waarde: string }[], diepte = 0): void {
  if (diepte > 9 || obj == null) return;
  if (typeof obj === "string") {
    if (obj.includes("@") && obj.includes(".")) uit.push({ pad, waarde: obj });
    return;
  }
  if (typeof obj !== "object") return;
  for (const k of Object.keys(obj)) {
    vindEmails((obj as any)[k], pad ? pad + "." + k : k, uit, diepte + 1);
  }
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!process.env.KOLIBRI_DEBUG_KEY || key !== process.env.KOLIBRI_DEBUG_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const contracten = await getAllMediaContracts();
    const actief = contracten.filter((c) => c.MediaContractStatus.toUpperCase() === "ACTIVE");
    if (actief.length === 0) {
      return NextResponse.json({ ok: true, aantalContracten: contracten.length, actief: 0 });
    }
    const c = actief[0];
    const summaries = await getSummariesForRealtor(c.RealtorID);
    if (summaries.length === 0) {
      return NextResponse.json({ ok: true, contract: c, panden: 0 });
    }
    const pand: any = await getProperty(c.RealtorID, summaries[0].RealEstateProperyID);
    const emails: { pad: string; waarde: string }[] = [];
    vindEmails(pand, "", emails);
    const topKeys = pand && typeof pand === "object" ? Object.keys(pand) : [];
    const sub = (naam: string) => (pand && pand[naam] && typeof pand[naam] === "object" ? Object.keys(pand[naam]) : undefined);
    return NextResponse.json({
      ok: true,
      contract: { id: c.MediaContractID, realtorId: c.RealtorID, naam: c.Name },
      topKeys,
      realtorKeys: sub("Realtor") || sub("Office") || sub("Agent") || sub("Contact"),
      emails,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 502 });
  }
}
