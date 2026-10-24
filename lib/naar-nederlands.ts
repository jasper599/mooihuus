import { vraagAnthropic } from "@/lib/anthropic";

// Normaliseert vrije advertentietekst (titel of omschrijving) naar het Nederlands.
// Nederlands blijft ongewijzigd; een andere taal (bv. Duits of Engels) wordt naar
// natuurlijk Nederlands vertaald. Zo is de OPGESLAGEN tekst altijd Nederlands — de
// leidende basis — en verzorgen de taalknoppen (EN/DE) op de woningpagina de
// vertaling vanuit die Nederlandse basis.
// Faalt veilig: zonder API-sleutel of bij een fout komt de originele tekst terug,
// zodat een plaatsing nooit blokkeert op de vertaalstap.
export async function naarNederlands(text: string): Promise<string> {
  const bron = (text || "").trim();
  if (!bron) return text;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return text;

  const system =
    `Je bent een professionele vertaler voor een Nederlandse marktplaats van ` +
    `recreatiewoningen. Je krijgt tekst uit een woningadvertentie (een titel of een omschrijving).\n\n` +
    `Taak: zorg dat de tekst in natuurlijk, vloeiend Nederlands staat.\n` +
    `- Is de tekst al Nederlands? Geef 'm dan EXACT ongewijzigd terug.\n` +
    `- Is de tekst in een andere taal (bijvoorbeeld Duits of Engels)? Vertaal 'm dan naar ` +
    `vlot, wervend Nederlands zoals een Nederlandse makelaar het zou schrijven.\n` +
    `- Behoud de structuur, alinea's en regeleinden.\n` +
    `- Laat eigennamen staan (plaats-, park-, merk- en persoonsnamen).\n` +
    `- Houd getallen, prijzen, maten en eenheden exact gelijk (bijv. "€ 399.000", "57 m²", "4 personen").\n` +
    `- Verzin geen feiten die niet in de bron staan.\n` +
    `- Geef ALLEEN de tekst terug. Geen inleiding, geen aanhalingstekens, geen uitleg.`;

  try {
    const { text: nl } = await vraagAnthropic(key, {
      system,
      messages: [{ role: "user", content: bron.slice(0, 4000) }],
      max_tokens: 1500,
      temperature: 0.2,
      voorkeur: "sonnet",
      envModel: process.env.VERTAAL_MODEL,
      timeoutMs: 20000,
    });
    const schoon = (nl || "").trim().replace(/^["'`]|["'`]$/g, "");
    return schoon || text;
  } catch {
    return text;
  }
}
