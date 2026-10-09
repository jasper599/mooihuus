// Uitgaand bellen met Guus (Mooihuus) — volledig gescheiden van Max/Luyten.
//
// Guus belt Jasper om hem belangrijke Mooihuus-dingen door te geven:
//   (1) een nieuw telefonisch support-ticket;
//   (2) een nieuwe betaalde plaatsing;
//   (3) een mislukte betaling / er gaat iets mis.
//
// Gebruikt Guus' eigen ElevenLabs-agent + telefoonnummer (eigen merk). Belt
// uitsluitend Jasper — nooit een onbekende. Faalt nooit hard: zonder sleutel of
// bij een fout gebeurt er simpelweg niets (de aanroepende flow loopt door).

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.GUUS_AGENT_ID || "agent_9001m40n67jcfp09xgfsnazc84m7";
const PHONE_NUMBER_ID = process.env.GUUS_PHONE_NUMBER_ID || "phnum_7601m4fwqwa8f5493a7b0r05tws9";
const JASPER_NUMMER = process.env.GUUS_BELT_NAAR || "+31623575729";
const OUTBOUND_URL = "https://api.elevenlabs.io/v1/convai/twilio/outbound-call";

// Noodrem: zet GUUS_BELT=0 om alle uitgaande Guus-belletjes uit te zetten.
function belletjesAan(): boolean {
  const v = (process.env.GUUS_BELT || "1").trim().toLowerCase();
  return !["0", "false", "nee", "uit", "off"].includes(v);
}

// Belt Jasper met een kant-en-klare openingszin. Fire-and-forget: altijd veilig
// aan te roepen, gooit nooit, blokkeert de aanroeper niet lang (korte timeout).
export async function guusBeltJasper(
  opening: string
): Promise<{ ok: boolean; fout?: string; conversation_id?: string }> {
  if (!belletjesAan()) return { ok: false, fout: "uitgeschakeld (GUUS_BELT)" };
  if (!ELEVEN_API_KEY) return { ok: false, fout: "ELEVENLABS_API_KEY ontbreekt" };

  const zin = (opening || "").trim() || "Hoi Jasper, met Guus van Mooihuus.";
  const body = {
    agent_id: AGENT_ID,
    agent_phone_number_id: PHONE_NUMBER_ID,
    to_number: JASPER_NUMMER,
    conversation_initiation_client_data: {
      conversation_config_override: { agent: { first_message: zin } },
      // Zodat Guus ook tijdens dit uitgaande gesprek weet dat hij Jasper spreekt
      // (op een uitgaand gesprek is de caller-id namelijk Guus' eigen nummer).
      dynamic_variables: { beller_voornaam: "Jasper", beller_bekend: "ja" },
    },
  };

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(OUTBOUND_URL, {
      method: "POST",
      headers: { "xi-api-key": ELEVEN_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const tekst = await res.text().catch(() => "");
      return { ok: false, fout: `ElevenLabs ${res.status}: ${tekst.slice(0, 200)}` };
    }
    const data: any = await res.json().catch(() => ({}));
    return { ok: true, conversation_id: data?.conversation_id };
  } catch (e: any) {
    return { ok: false, fout: `verbinding mislukt: ${e?.message || e}` };
  }
}

// Comfort-wrapper: start het belletje zonder erop te wachten en vang alles op,
// zodat een trage of mislukte call nooit de web-request ophoudt of laat falen.
export function guusBeltJasperOpAchtergrond(opening: string): void {
  try {
    void guusBeltJasper(opening).then((r) => {
      if (!r.ok) console.error("[guus-bel] belletje niet gestart:", r.fout);
    });
  } catch (e: any) {
    console.error("[guus-bel] onverwachte fout:", e?.message || e);
  }
}
