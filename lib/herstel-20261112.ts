import { getPayments, getUsers, addPayment, updatePayment } from "./db";
import { sendEmail } from "./email";
import { genereerFactuurPdfBase64 } from "./factuur-pdf";
import { syncBetalingen } from "./eboekhouden";
import { factuurAfzender } from "./company";

// Eenmalig boekhoudherstel (12-11-2026). Idempotent: elke stap kijkt eerst of
// hij al gedaan is.
// 1) ZuyderHuys: factuur MH-2026-0011 staat in e-Boekhouden, de creditnota
//    (destijds verstuurd als MH-2026-0013) is nooit geboekt en werd uit
//    Mooihuus gewist. Nieuwe creditnota met een eigen nummer, plus het
//    factuurrecord 0011 terug in Mooihuus (als gecrediteerd, al geboekt).
// 2) Opvallers MH-2026-0002 en 0003: nooit betaald, wel als omzet geboekt.
//    Afboeken met een creditnota.
// Creditnota's gaan alleen als kopie naar facturen@, niet naar de klant.

const KOPIE = process.env.FACTUUR_EMAIL || "facturen@mooihuus.nl";

function heeftCredit(nr: string): boolean {
  return getPayments().some((c) => c.soort === "creditnota" && (c.omschrijving || "").includes("bij factuur " + nr));
}

async function archiveer(credit: { factuurnummer: string; bedrag: number }, origineel: string, kantoor: string, titel: string) {
  try {
    const totaal = Math.round(Math.abs(credit.bedrag) * 100) / 100;
    const sub = Math.round((totaal / 1.21) * 100) / 100;
    const btw = Math.round((totaal - sub) * 100) / 100;
    const pdf = await genereerFactuurPdfBase64({
      kantoor,
      factuurnummer: credit.factuurnummer,
      origineelFactuurnummer: origineel,
      credit: true,
      objecten: [{ titel, prijs: -sub }],
      prijsPerObject: -sub,
      subtotaal: -sub,
      btw: -btw,
      totaal: -totaal,
      betaalUrl: "",
    } as any);
    await sendEmail({
      aan: KOPIE,
      onderwerp: `Archief: creditnota ${credit.factuurnummer} bij factuur ${origineel} (${kantoor})`,
      soort: "factuur" as any,
      html: `<p>Creditnota ${credit.factuurnummer} bij factuur ${origineel} voor ${kantoor}, ${titel}. Alleen voor de administratie, niet naar de klant gestuurd.</p>`,
      van: factuurAfzender(),
      attachments: [{ filename: `Creditnota ${credit.factuurnummer} Huus BV.pdf`, content: pdf, contentType: "application/pdf" }],
    });
  } catch (e) {
    console.error("[herstel] archiefmail mislukt", credit.factuurnummer, e);
  }
}

export async function herstelBoekhouding20261112(): Promise<void> {
  // 1) ZuyderHuys
  if (!heeftCredit("MH-2026-0011")) {
    // Ter controle: factuur 0006 (Mooihuus 55, e-Boekhouden 79)
    const zes = getPayments().find((x) => x.factuurnummer === "MH-2026-0006");
    if (zes) console.log(`[herstel] 0006: ${JSON.stringify(zes)}`);
    const zuyder = getUsers().find((u: any) => /zuyderhuys/i.test(`${u.bedrijfsnaam || ""} ${u.naam || ""}`));
    if (zuyder) {
      const credit = addPayment({
        listingId: "verwijderd-MH-2026-0011",
        userId: zuyder.id,
        pakket: "Premium" as any,
        bedrag: -55,
        status: "paid",
        methode: "creditnota",
        soort: "creditnota",
        omschrijving: "Creditnota bij factuur MH-2026-0011 (Appartement in Heerlen), niet betaald binnen de termijn. Vervangt de eerder verstuurde creditnota met het dubbele nummer MH-2026-0013.",
      });
      console.log(`[herstel] creditnota ${credit.factuurnummer} bij MH-2026-0011 (ZuyderHuys)`);
      await archiveer(credit, "MH-2026-0011", zuyder.bedrijfsnaam || zuyder.naam, "Appartement in Heerlen");
      if (!getPayments().some((p) => p.factuurnummer === "MH-2026-0011")) {
        const terug = addPayment({
          listingId: "verwijderd-MH-2026-0011",
          userId: zuyder.id,
          pakket: "Premium" as any,
          bedrag: 55,
          status: "failed",
          methode: "Gecrediteerd",
          soort: "advertentie",
          omschrijving: "Jaaradvertentie Mooihuus: Appartement in Heerlen (hersteld record)",
        });
        updatePayment(terug.id, {
          factuurnummer: "MH-2026-0011",
          aangemaakt: "2026-11-04T10:47:12.000Z",
          geboektInEboekhouden: true,
          eboekhoudenFactuurId: "2602",
        });
        console.log(`[herstel] record MH-2026-0011 teruggezet (${terug.id})`);
      }
    } else {
      console.error("[herstel] ZuyderHuys niet gevonden");
    }
  }

  // 2) Onbetaalde opvallers die toch geboekt zijn
  for (const nr of ["MH-2026-0002", "MH-2026-0003"]) {
    if (heeftCredit(nr)) continue;
    const p = getPayments().find((x) => x.factuurnummer === nr);
    if (!p || p.status === "paid" || p.soort !== "opvaller") continue;
    const credit = addPayment({
      listingId: p.listingId,
      userId: p.userId,
      pakket: p.pakket,
      bedrag: -Math.abs(p.bedrag),
      status: "paid",
      methode: "creditnota",
      soort: "creditnota",
      omschrijving: `Creditnota bij factuur ${nr} (opvaller ${p.omschrijving || ""}), niet betaald.`.slice(0, 180),
    });
    updatePayment(p.id, { methode: "Gecrediteerd" });
    const owner = getUsers().find((u) => u.id === p.userId) as any;
    console.log(`[herstel] creditnota ${credit.factuurnummer} bij ${nr}`);
    await archiveer(credit, nr, owner?.bedrijfsnaam || owner?.naam || "klant", `Opvaller ${p.omschrijving || ""}`);
  }

  // 4) Nieuwe creditnota's direct boeken
  const nieuw = getPayments().filter((c) => c.soort === "creditnota" && !c.geboektInEboekhouden && (c.aangemaakt || "").startsWith("2026-11-12"));
  if (nieuw.length) {
    const res = await syncBetalingen({ dry: false });
    console.log(`[herstel] e-Boekhouden: ${res.geboekt} geboekt, fouten: ${JSON.stringify(res.fouten)}`);
  }
}

// Eenmalig (13-11-2026, op verzoek van Jasper): pdf's van MH-2026-0013, 0014,
// 0016 en 0017 naar facturen@luytenmakelaardij.nl. Alleen als de klant van die
// factuur Luyten Makelaardij is; anders alleen een logregel.
export async function stuurNaarLuytenFacturen(): Promise<void> {
  const AAN = "facturen@luytenmakelaardij.nl";
  const { getListing } = await import("./db");
  for (const nr of ["MH-2026-0013", "MH-2026-0014", "MH-2026-0016", "MH-2026-0017"]) {
    const p = getPayments().find((x) => x.factuurnummer === nr);
    if (!p || (p as any).naarLuytenFacturen) continue;
    const owner = getUsers().find((u) => u.id === p.userId) as any;
    const kantoor = owner?.bedrijfsnaam || owner?.naam || "";
    if (!/luyten/i.test(kantoor)) {
      updatePayment(p.id, { naarLuytenFacturen: "overgeslagen" } as any);
      console.log(`[luyten-facturen] ${nr} overgeslagen: klant is ${kantoor || "onbekend"}`);
      continue;
    }
    try {
      const credit = p.soort === "creditnota";
      const totaal = Math.round(Math.abs(p.bedrag) * 100) / 100;
      const sub = Math.round((totaal / 1.21) * 100) / 100;
      const btw = Math.round((totaal - sub) * 100) / 100;
      const l = getListing(p.listingId);
      const titel = l?.titel || p.omschrijving || "Mooihuus";
      const teken = credit ? -1 : 1;
      const origineel = credit ? ((p.omschrijving || "").match(/MH-\d{4}-\d{4}/)?.[0] || "") : undefined;
      const pdf = await genereerFactuurPdfBase64({
        kantoor,
        email: owner?.email,
        factuurnummer: nr,
        credit,
        origineelFactuurnummer: origineel,
        objecten: [{ titel, prijs: teken * sub }],
        prijsPerObject: teken * sub,
        subtotaal: teken * sub,
        btw: teken * btw,
        totaal: teken * totaal,
        betaalUrl: "",
        betaald: !credit && p.status === "paid",
        betaaldOp: p.betaaldOp,
      } as any);
      const soortTekst = credit ? `Creditnota ${nr}${origineel ? " bij factuur " + origineel : ""}` : `Factuur ${nr}${p.status === "paid" ? " (betaald)" : ""}`;
      await sendEmail({
        aan: AAN,
        onderwerp: `${soortTekst} · Huus B.V. (Mooihuus)`,
        soort: "factuur" as any,
        html: `<p>Beste Luyten Makelaardij,</p><p>In de bijlage ${credit ? "de creditnota" : "de factuur"} ${nr} van Huus B.V. (Mooihuus.nl) voor uw administratie: ${titel}.</p><p>Met vriendelijke groet,<br>Huus B.V.</p>`,
        van: factuurAfzender(),
        attachments: [{ filename: `${credit ? "Creditnota" : "Factuur"} ${nr} Huus BV.pdf`, content: pdf, contentType: "application/pdf" }],
      });
      updatePayment(p.id, { naarLuytenFacturen: new Date().toISOString() } as any);
      console.log(`[luyten-facturen] ${nr} verstuurd naar ${AAN}`);
    } catch (e) {
      console.error("[luyten-facturen] mislukt", nr, e);
    }
  }
}

// Tijdelijk (13-11-2026): overzicht nieuwsbrieflijst in de log, adressen deels
// gemaskeerd. Alleen lezen.
export function logNieuwsbrief(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getNieuwsbriefLeden } = require("./db");
  const leden: any[] = getNieuwsbriefLeden();
  const regels = leden.map((l) => {
    const [lok, dom] = String(l.email).split("@");
    const m = lok.length <= 3 ? lok[0] + "*" : lok.slice(0, 3) + "*".repeat(Math.min(lok.length - 3, 8));
    return `${String(l.datum || "").slice(0, 16)} ${m}@${dom} (${lok.length})`;
  });
  console.log(`[NB-CHECK] ${leden.length} leden`);
  for (let i = 0; i < regels.length; i += 15) console.log("[NB-CHECK] " + regels.slice(i, i + 15).join(" | "));
}
