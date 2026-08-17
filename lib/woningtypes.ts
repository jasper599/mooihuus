// Woningtypes voor SEO-landingspagina's (/type/[type]).
// De canonieke naam komt overeen met listing.type; matching is hoofdletter-
// ongevoelig. Elk type heeft een meervoud (voor koppen) en een korte introtekst.

export type Woningtype = {
  naam: string;   // canoniek, zoals in listing.type
  mv: string;     // meervoud voor koppen
  intro: string;  // korte, unieke tekst (SEO + lezer)
};

export const WONINGTYPES: Woningtype[] = [
  { naam: "Chalet", mv: "Chalets", intro: "Een chalet combineert het comfort van een woning met de sfeer van buiten. Bekijk chalets te koop op recreatieparken door heel Nederland." },
  { naam: "Bungalow", mv: "Bungalows", intro: "Gelijkvloers en onderhoudsarm — de bungalow is een geliefde recreatiewoning voor jong en oud." },
  { naam: "Stacaravan", mv: "Stacaravans", intro: "Betaalbaar en instapklaar: een stacaravan is de laagdrempelige manier om een eigen plek op een vakantiepark te hebben." },
  { naam: "Tiny house", mv: "Tiny houses", intro: "Klein, duurzaam en helemaal van jou — tiny houses zijn populair als compacte recreatiewoning." },
  { naam: "Vrijstaand vakantiehuis", mv: "Vrijstaande vakantiehuizen", intro: "Ruimte, privacy en vrijheid: een vrijstaand vakantiehuis biedt het meeste comfort voor je tweede huus." },
  { naam: "Recreatiewoning", mv: "Recreatiewoningen", intro: "De klassieke recreatiewoning: een eigen plek om het hele jaar door van te genieten, op de mooiste plekken in Nederland." },
  { naam: "Appartement", mv: "Recreatieappartementen", intro: "Onderhoudsarm en vaak centraal op het park — een recreatieappartement is ideaal voor wie zorgeloos wil genieten." },
  { naam: "Groepsaccommodatie", mv: "Groepsaccommodaties", intro: "Ruimte voor familie en vrienden: groepsaccommodaties zijn perfect voor grotere gezelschappen." },
];

export function typeSlug(naam: string): string {
  return naam.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function typeVanSlug(slug: string): Woningtype | undefined {
  return WONINGTYPES.find((t) => typeSlug(t.naam) === slug);
}

// Matcht een listing.type op een canoniek type (hoofdletter-ongevoelig).
export function isType(listingType: string, canoniek: string): boolean {
  return (listingType || "").trim().toLowerCase() === canoniek.toLowerCase();
}
