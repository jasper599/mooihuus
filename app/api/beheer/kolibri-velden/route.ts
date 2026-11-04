import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllMediaContracts, getSummariesForRealtor, getProperty, kolibriGeconfigureerd } from "@/lib/kolibri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Diagnose (alleen beheer, alleen-lezen): toont per Kolibri-pand alle velden die
// de makelaar meestuurt, zonder teksten en bijlagen. Bedoeld om te vinden welk
// veld aangeeft of een pand een recreatiewoning of een gewoon woonhuis is.
function plat(obj: any, prefix = "", uit: Record<string, string> = {}): Record<string, string> {
  if (obj === null || obj === undefined) return uit;
  if (typeof obj !== "object") {
    const v = String(obj);
    uit[prefix] = v.length > 80 ? v.slice(0, 80) + "…" : v;
    return uit;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (/^(Descriptions|Attachments|Movies|VirtualTours|Videos)$/.test(k)) continue;
    plat(v, prefix ? `${prefix}.${k}` : k, uit);
  }
  return uit;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") {
    return NextResponse.json({ error: "Alleen beheer." }, { status: 403 });
  }
  if (!kolibriGeconfigureerd()) return NextResponse.json({ error: "Kolibri niet geconfigureerd." }, { status: 400 });
  const panden: any[] = [];
  for (const c of await getAllMediaContracts()) {
    if (c.MediaContractStatus && c.MediaContractStatus.toUpperCase() !== "ACTIVE") continue;
    const sums = await getSummariesForRealtor(c.RealtorID).catch(() => []);
    for (const s of sums.slice(0, 15)) {
      try {
        const p = await getProperty(c.RealtorID, s.RealEstateProperyID);
        panden.push({ kantoor: c.Name, realtor: c.RealtorID, id: s.RealEstateProperyID, adres: s.AddressSummary, velden: plat(p) });
      } catch (e: any) {
        panden.push({ kantoor: c.Name, id: s.RealEstateProperyID, fout: String(e?.message || e).slice(0, 120) });
      }
    }
  }
  return NextResponse.json({ aantal: panden.length, panden });
}
