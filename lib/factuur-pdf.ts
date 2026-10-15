import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { COMPANY } from "./company";

// Mooihuus-huisstijl (0..1)
const C = {
  bosgroen: rgb(0x2C / 255, 0x6B / 255, 0x45 / 255),
  bosgroenDk: rgb(0x1F / 255, 0x4E / 255, 0x32 / 255),
  salie: rgb(0x7C / 255, 0xAE / 255, 0x86 / 255),
  oranje: rgb(0xE8 / 255, 0x82 / 255, 0x3B / 255),
  oranjeDk: rgb(0xC9 / 255, 0x69 / 255, 0x1F / 255),
  zand: rgb(0xF6 / 255, 0xF1 / 255, 0xE7 / 255),
  inkt: rgb(0x22 / 255, 0x30 / 255, 0x2A / 255),
  grijs: rgb(0x6B / 255, 0x7A / 255, 0x70 / 255),
  lijn: rgb(0xE4 / 255, 0xDC / 255, 0xCB / 255),
  wit: rgb(1, 1, 1),
};

function euro(n: number): string {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function datumNL(d: number | string | Date): string {
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

export interface FactuurPdfData {
  kantoor: string;
  factuurnummer: string;
  objecten: { titel: string; prijs?: number }[];
  prijsPerObject?: number;
  subtotaal?: number; // excl. btw
  btw?: number;       // 21%-bedrag
  totaal: number;     // incl. btw (bedrag dat betaald wordt)
  betaalUrl: string;
  datum?: number | string | Date;
  omschrijving?: string;
}

export async function genereerFactuurPdfBytes(d: FactuurPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Factuur " + d.factuurnummer + " — Mooihuus");
  doc.setProducer("Mooihuus.nl");
  const page = doc.addPage([595.28, 841.89]);
  const W = 595.28, H = 841.89;
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 48;
  const text = (s: unknown, x: number, y: number, size: number, font = reg, color = C.inkt) =>
    page.drawText(String(s), { x, y, size, font, color });
  const textR = (s: unknown, xR: number, y: number, size: number, font = reg, color = C.inkt) => {
    const w = font.widthOfTextAtSize(String(s), size);
    page.drawText(String(s), { x: xR - w, y, size, font, color });
  };

  const heeftBtw = typeof d.subtotaal === "number" && typeof d.btw === "number";

  // Header
  const hH = 104;
  page.drawRectangle({ x: 0, y: H - hH, width: W, height: hH, color: C.bosgroenDk });
  let wx = M; const wy = H - 52, wsz = 22;
  text("Mooi", wx, wy, wsz, bold, C.salie); wx += bold.widthOfTextAtSize("Mooi", wsz);
  text("huus", wx, wy, wsz, bold, C.wit); wx += bold.widthOfTextAtSize("huus", wsz);
  text(".nl", wx, wy, wsz, bold, C.oranje);
  text("Het platform voor recreatiewoningen", M, H - 72, 9.5, reg, C.salie);
  textR("FACTUUR", W - M, H - 50, 24, bold, C.wit);
  textR("Betaalkenmerk " + d.factuurnummer, W - M, H - 72, 9.5, reg, rgb(0.81, 0.88, 0.83));

  // Factuur aan + meta
  let y = H - hH - 42;
  text("FACTUUR AAN", M, y, 9, bold, C.grijs);
  text(d.kantoor || "—", M, y - 17, 13, bold, C.inkt);
  const metaX = 330, metaVal = W - M;
  const metaRow = (label: string, val: string, yy: number) => {
    text(label, metaX, yy, 9.5, reg, C.grijs);
    textR(val, metaVal, yy, 9.5, bold, C.inkt);
  };
  metaRow("Factuurnummer", d.factuurnummer, y);
  metaRow("Factuurdatum", datumNL(d.datum || Date.now()), y - 15);
  metaRow("Betaalwijze", "iDEAL (betaallink)", y - 30);

  // Tabel
  y -= 66;
  page.drawRectangle({ x: M, y: y - 6, width: W - 2 * M, height: 22, color: C.zand });
  text("OMSCHRIJVING", M + 10, y, 9, bold, C.grijs);
  textR(heeftBtw ? "BEDRAG (EXCL. BTW)" : "BEDRAG", W - M - 10, y, 9, bold, C.grijs);
  y -= 26;

  const regels = (d.objecten && d.objecten.length ? d.objecten : [{ titel: d.omschrijving || "Advertentie op Mooihuus" }]);
  const maxTextW = (W - 2 * M - 20) - 130;
  regels.forEach((o, i) => {
    let titel = (i + 1) + ".  " + (o.titel || "Advertentie op Mooihuus");
    const vol = titel;
    while (reg.widthOfTextAtSize(titel, 11) > maxTextW && titel.length > 4) titel = titel.slice(0, -2);
    if (titel !== vol && reg.widthOfTextAtSize(titel + "…", 11) <= maxTextW) titel = titel + "…";
    text(titel, M + 10, y, 11, reg, C.inkt);
    textR(euro(o.prijs ?? d.prijsPerObject ?? 0), W - M - 10, y, 11, reg, C.inkt);
    y -= 7;
    page.drawLine({ start: { x: M + 10, y }, end: { x: W - M - 10, y }, thickness: 0.5, color: C.lijn });
    y -= 17;
  });

  // Totalen
  y -= 6;
  if (heeftBtw) {
    const lblX = W - M - 190;
    const sub = (label: string, val: string, yy: number) => {
      text(label, lblX, yy, 10.5, reg, C.grijs);
      textR(val, W - M - 10, yy, 10.5, reg, C.inkt);
    };
    sub("Subtotaal (excl. btw)", euro(d.subtotaal as number), y); y -= 16;
    sub("Btw 21%", euro(d.btw as number), y); y -= 12;
    page.drawLine({ start: { x: lblX, y }, end: { x: W - M - 10, y }, thickness: 0.6, color: C.lijn }); y -= 14;
  }
  page.drawRectangle({ x: M, y: y - 8, width: W - 2 * M, height: 30, color: C.bosgroenDk });
  text(heeftBtw ? "Totaal te voldoen (incl. btw)" : ("Totaal te voldoen (" + regels.length + " " + (regels.length === 1 ? "object" : "objecten") + ")"), M + 10, y, 12, bold, C.wit);
  textR(euro(d.totaal), W - M - 10, y, 14, bold, C.wit);
  y -= 36;

  // Betaalblok
  text("Betalen", M, y, 11, bold, C.bosgroenDk); y -= 16;
  for (const r of ["Betaal deze factuur veilig via iDEAL met de betaallink. Zodra de betaling", "binnen is, gaat de woning automatisch online op Mooihuus.nl."]) { text(r, M, y, 10, reg, C.inkt); y -= 14; }
  y -= 2;
  text("Betaallink:", M, y, 9.5, bold, C.grijs);
  let link = d.betaalUrl || ""; const volLink = link;
  while (reg.widthOfTextAtSize(link, 9) > (W - 2 * M - 70) && link.length > 10) link = link.slice(0, -2);
  if (link !== volLink) link += "…";
  text(link, M + 58, y, 9, reg, C.oranjeDk);

  // Footer
  const fy = 60;
  page.drawLine({ start: { x: M, y: fy + 20 }, end: { x: W - M, y: fy + 20 }, thickness: 0.6, color: C.lijn });
  const web = (COMPANY.website || "").replace(/^https?:\/\//, "");
  text(COMPANY.bv + " · handelsnaam " + COMPANY.handelsnaam + " · " + COMPANY.adres + ", " + COMPANY.postcode, M, fy + 6, 8.5, reg, C.grijs);
  text("KvK " + COMPANY.kvk + " · btw " + COMPANY.btw + " · " + COMPANY.email + " · " + web, M, fy - 6, 8.5, reg, C.grijs);
  textR("Zelf de regie, nooit alleen.", W - M, fy - 6, 8.5, bold, C.salie);

  return await doc.save();
}

export async function genereerFactuurPdfBase64(d: FactuurPdfData): Promise<string> {
  const bytes = await genereerFactuurPdfBytes(d);
  return Buffer.from(bytes).toString("base64");
}
