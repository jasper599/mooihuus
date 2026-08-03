import { NextResponse } from "next/server";

// ------------------------------------------------------------------
// AI-teksthulp — MVP-stub.
// Genereert deterministisch een titel, omschrijving en prijsindicatie.
// Integratiepunt: vervang de body hieronder door een echte LLM-call
// (bijv. Anthropic/OpenAI) met dezelfde in-/output. Zie README.
// ------------------------------------------------------------------

export async function POST(req: Request) {
  const f = await req.json();
  const type = String(f.type ?? "woning").toLowerCase();
  const prov = String(f.provincie ?? "Nederland");
  const pers = f.personen ?? 4;
  const park = f.park ?? "";
  const prijs = Number(f.prijs ?? 0);

  const titel = `Sfeervolle ${type} in ${prov} — jouw tweede thuis`;
  const omschrijving =
    `Kom thuis in deze ${type}${park ? ` op ${park}` : ""} in ${prov}. ` +
    `Ruimte voor ${pers} personen, midden in het groen en heerlijk rustig gelegen. ` +
    `Zet de deuren open, ruik de buitenlucht en kom tot rust — dit is de plek waar vakantie ` +
    `vanzelf begint. Instapklaar en met alle comfort binnen handbereik.`;

  const lo = Math.round((prijs * 0.95) / 1000) * 1000;
  const hi = Math.round((prijs * 1.08) / 1000) * 1000;
  const prijsindicatie =
    `Vergelijkbare woningen in ${prov} staan rond € ${lo.toLocaleString("nl-NL")} – ` +
    `€ ${hi.toLocaleString("nl-NL")}. Jouw vraagprijs valt daar mooi binnen. Jij beslist.`;

  return NextResponse.json({ titel, omschrijving, prijsindicatie });
}
