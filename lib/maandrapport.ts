import { getUsers, getUser, getListingsByOwner, getListingStats, getLaatsteMaandrapportMaand, setLaatsteMaandrapportMaand } from "./db";
import { renderMaandrapport, sendEmail } from "./email";

function maandLabel(d = new Date()): string {
  return d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}
function maandKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Stuurt één makelaar zijn maandrapport (weergaven + leads per woning).
export async function stuurMaandrapport(ownerId: string): Promise<{ ok: boolean; reden?: string; aantal?: number }> {
  const owner = getUser(ownerId);
  if (!owner) return { ok: false, reden: "Makelaar niet gevonden." };
  const woningen = getListingsByOwner(ownerId).filter((l) => l.status === "live" || l.status === "verkocht");
  if (woningen.length === 0) return { ok: false, reden: "Geen woningen om over te rapporteren." };

  const rows = woningen.map((l) => {
    const s = getListingStats(l.id);
    return { titel: l.titel, weergaven: s.weergaven, leads: s.leads };
  });
  const totWeergaven = rows.reduce((a, r) => a + r.weergaven, 0);
  const totLeads = rows.reduce((a, r) => a + r.leads, 0);

  const mail = renderMaandrapport({
    kantoor: owner.bedrijfsnaam || owner.naam,
    maand: maandLabel(),
    rows,
    totWeergaven,
    totLeads,
  });
  const aan = owner.factuurEmail || owner.email;
  await sendEmail({ aan, onderwerp: mail.onderwerp, soort: "rapport", html: mail.html });
  return { ok: true, aantal: woningen.length };
}

// Stuurt alle zakelijke accounts hun maandrapport.
export async function stuurAlleMaandrapporten(): Promise<{ verzonden: number }> {
  const makelaars = getUsers().filter((u) => u.type === "zakelijk" && u.rol === "eigenaar");
  let verzonden = 0;
  for (const m of makelaars) {
    const r = await stuurMaandrapport(m.id);
    if (r.ok) verzonden++;
  }
  return { verzonden };
}

// Automatisch: als het een nieuwe maand is, één keer alle rapporten sturen.
export function markeerHuidigeMaandAlsBasis(): void {
  if (getLaatsteMaandrapportMaand() === undefined) setLaatsteMaandrapportMaand(maandKey());
}
export async function stuurMaandrapportenIndienNieuweMaand(): Promise<void> {
  const nu = maandKey();
  if (getLaatsteMaandrapportMaand() === nu) return;
  setLaatsteMaandrapportMaand(nu); // meteen markeren → voorkomt dubbel
  await stuurAlleMaandrapporten();
}
