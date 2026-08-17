import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing } from "@/lib/db";
import { euro, prijsSuffix, gradient } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const l = getListing(params.id);
  return { title: l ? `Brochure — ${l.titel}` : "Brochure", robots: { index: false } };
}

export default function Brochure({ params }: { params: { id: string } }) {
  const l = getListing(params.id);
  if (!l) return notFound();

  const rows: [string, string][] = [];
  rows.push(["Type", l.type]);
  if (l.bouwjaar) rows.push(["Bouwjaar", String(l.bouwjaar)]);
  if (l.m2) rows.push(["Woonoppervlakte", `${l.m2} m²`]);
  if (l.perceel) rows.push(["Perceel", `${l.perceel} m²`]);
  if (l.slaapkamers) rows.push(["Slaapkamers", String(l.slaapkamers)]);
  if (l.personen) rows.push(["Max. personen", String(l.personen)]);
  if (l.grond) rows.push(["Grond", l.grond]);
  if (l.energielabel) rows.push(["Energielabel", l.energielabel]);
  if (l.kosten) rows.push(["Kosten", l.kosten]);
  rows.push(["Aangeboden als", l.doel === "huur" ? "Te huur" : "Te koop"]);

  const fotos = (l.fotos ?? []).slice(0, 5);
  const prijs = `${euro(l.prijs)}${prijsSuffix(l) ? " " + prijsSuffix(l) : ""}`;

  return (
    <div className="max-w-3xl mx-auto">
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          main { max-width: none !important; padding: 0 !important; }
          body { background: #fff !important; }
          a { color: inherit !important; text-decoration: none !important; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between mb-4">
        <Link href={`/aanbod/${l.id}`} className="text-sm text-bosgroen hover:underline">← Terug naar de woning</Link>
        <PrintButton />
      </div>

      <div className="bg-white border border-lijn rounded-2xl overflow-hidden">
        {/* Kop */}
        <div className="p-6 flex items-center justify-between" style={{ background: gradient(l.kleur) }}>
          <div className="font-display font-extrabold text-2xl text-white">Mooi<span style={{ color: "#1F4E32" }}>huus</span><span style={{ color: "#E8823B" }}>.nl</span></div>
          <div className="bg-white/90 text-bosgroen-dk font-display font-semibold text-sm px-3 py-1 rounded-full">
            {l.status === "verkocht" ? "Verkocht" : l.doel === "huur" ? "Te huur" : "Te koop"}
          </div>
        </div>

        <div className="p-6">
          <h1 className="font-display font-extrabold text-2xl text-bosgroen-dk">{l.titel}</h1>
          <div className="text-grijs mt-1">{[l.type, l.park, l.provincie].filter(Boolean).join(" · ")}</div>
          <div className="font-display font-extrabold text-2xl text-oranje-dk mt-2">{prijs}</div>

          {/* Foto's */}
          {fotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {fotos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`${l.titel} foto ${i + 1}`} className={`w-full object-cover rounded-xl border border-lijn ${i === 0 ? "col-span-2 h-64" : "h-32"}`} />
              ))}
            </div>
          )}

          {/* Kenmerken */}
          <h2 className="font-display font-bold text-lg text-bosgroen-dk mt-6 mb-2">Kenmerken</h2>
          <dl className="border border-lijn rounded-xl overflow-hidden">
            {rows.map(([k, v], i) => (
              <div key={k} className={`flex justify-between gap-4 px-4 py-2 text-sm ${i % 2 ? "bg-creme" : ""}`}>
                <dt className="text-grijs">{k}</dt>
                <dd className="font-semibold text-inkt text-right">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Omschrijving */}
          {l.omschrijving && (
            <>
              <h2 className="font-display font-bold text-lg text-bosgroen-dk mt-6 mb-2">Omschrijving</h2>
              <p className="text-inkt whitespace-pre-wrap leading-relaxed">{l.omschrijving}</p>
            </>
          )}

          {/* Voettekst */}
          <div className="mt-8 pt-4 border-t border-lijn text-sm text-grijs">
            Bekijk deze woning online op <strong>{COMPANY.website.replace(/^https?:\/\//, "")}/aanbod/{l.id}</strong> en neem daar direct contact op met de aanbieder.
          </div>
        </div>
      </div>
    </div>
  );
}
