import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Conversation-initiation webhook voor Guus (Mooihuus).
// ElevenLabs vraagt bij ELK inkomend gesprek wie er belt, zodat Guus meteen
// een persoonlijke openingszin kan kiezen. Herkenning gebeurt hier
// server-side (deterministisch), niet in de prompt.
//
// Vertrouwde interne nummers = volledige/interne modus (Jasper en team).
// Alle andere bellers = publieke modus (klant).
const INTERN: Record<string, string> = {
  jasper: "+31623575729",
};

function normNr(s: string): string {
  const t = (s || "").replace(/[^\d+]/g, "");
  if (!t) return "";
  if (t.startsWith("+")) return t;
  if (t.startsWith("0031")) return "+" + t.slice(2);
  if (t.startsWith("31")) return "+" + t;
  if (t.startsWith("0")) return "+31" + t.replace(/^0+/, "");
  return "+" + t;
}

function laatste9(s: string): string {
  return normNr(s).replace(/\D/g, "").slice(-9);
}

function geautoriseerd(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // geen secret ingesteld -> niet blokkeren
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-cron-key");
  return key === secret;
}

export async function POST(req: Request) {
  // Veilige terugval bij verkeerde/geen sleutel: geen override -> de agent
  // gebruikt zijn eigen standaardopening, dus een gesprek faalt nooit.
  if (!geautoriseerd(req)) {
    return NextResponse.json({ type: "conversation_initiation_client_data" });
  }

  const b = await req.json().catch(() => ({} as any));
  const caller = String(
    b.caller_id || b.system__caller_id || b.from || b.from_number || ""
  ).trim();

  const ln = laatste9(caller);
  let voornaam = "";
  if (ln) {
    for (const [naam, nr] of Object.entries(INTERN)) {
      if (laatste9(nr) === ln) {
        voornaam = naam;
        break;
      }
    }
  }

  if (voornaam) {
    const net = voornaam.charAt(0).toUpperCase() + voornaam.slice(1);
    return NextResponse.json({
      type: "conversation_initiation_client_data",
      dynamic_variables: { beller_voornaam: net, beller_bekend: "ja" },
      conversation_config_override: {
        agent: { first_message: `Hoi ${net}, je spreekt met Guus. Zeg het maar.` },
      },
    });
  }

  return NextResponse.json({
    type: "conversation_initiation_client_data",
    dynamic_variables: { beller_voornaam: "", beller_bekend: "onbekend" },
    conversation_config_override: {
      agent: {
        first_message: "Hoi, je spreekt met Guus van Mooihuus. Waar kan ik je mee helpen?",
      },
    },
  });
}
