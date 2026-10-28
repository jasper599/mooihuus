// Google Ads-conversies.
//
// De Google-tag (AW-…) laadt al via components/GoogleTag.tsx. Hier koppelen we
// de conversie-ACTIES: je maakt in Google Ads onder "Doelen → Conversies" een
// conversieactie aan (type: Website), Google geeft je dan een label in de vorm
// "AW-18370852382/AbCdEfGhIj". Plak dat label hieronder bij de juiste soort.
//
// Leeg laten = die conversie wordt (nog) niet gemeten (no-op). Zo kan dit
// veilig mee in de deploy en zet je 'm live door één string in te vullen.

export const ADS_ID = "AW-807554484";

export const CONVERSIES: Record<string, string> = {
  plaatsing: "", // betaalde plaatsing — maak evt. een "Aankoop"-conversieactie onder AW-807554484 en plak het label hier
  opvaller: "",  // idem als plaatsing
  lead: "AW-807554484/XmvICI3Z36wdELSbiYED", // Ingevuld lead-formulier (contact / bezichtiging / zoekopdracht)
};

// Vuurt een conversie af richting Google Ads. Veilig client-side: doet niets als
// er geen label is ingesteld of als de tag nog niet geladen is (consent geregeld
// door GoogleTag.tsx). Roep aan na een geslaagde actie.
export function meldConversie(
  soort: keyof typeof CONVERSIES | string,
  opts?: { waarde?: number; valuta?: string; transactieId?: string }
): void {
  if (typeof window === "undefined") return;
  const label = CONVERSIES[soort];
  const g = (window as any).gtag;
  if (!label || typeof g !== "function") return;
  g("event", "conversion", {
    send_to: label,
    value: opts?.waarde,
    currency: opts?.valuta || "EUR",
    transaction_id: opts?.transactieId,
  });
}
