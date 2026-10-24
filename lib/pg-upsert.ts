// Zelfstandige, directe write-through van één woning naar Postgres.
// Onafhankelijk van de mirror-module-state (die in Next niet altijd gedeeld is
// tussen instrumentation en route-handlers), zodat een nieuwe of gewijzigde
// woning ALTIJD meteen in Postgres (de bron van waarheid) belandt en dus een
// herstart overleeft. Nooit fataal: db.json blijft het vangnet.
let _prisma: any = null;
async function getPrisma(): Promise<any | null> {
  if (!process.env.DATABASE_URL) return null;
  if (_prisma) return _prisma;
  try { const m: any = await import("@prisma/client"); _prisma = new m.PrismaClient(); }
  catch { _prisma = null; }
  return _prisma;
}
export async function pgUpsertListing(l: any): Promise<void> {
  try {
    const p = await getPrisma();
    if (!p || !l || !l.id) return;
    const id = String(l.id);
    await p.listing.upsert({ where: { id }, create: { id, data: l }, update: { data: l } });
  } catch { /* niet fataal */ }
}
export async function pgUpsertUser(u: any): Promise<void> {
  try {
    const p = await getPrisma();
    if (!p || !u || !u.id) return;
    const id = String(u.id);
    await p.user.upsert({ where: { id }, create: { id, data: u }, update: { data: u } });
  } catch { /* niet fataal */ }
}
