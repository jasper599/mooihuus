import { HUURPARTNERS } from "@/lib/huurpartners";
import { gradient } from "@/lib/format";
import { Locale } from "@/lib/i18n";

// "Ook te huur bij onze partners"-blok. Toont affiliate-partners als kaarten
// die naar de partner linken (sponsored/nofollow).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function HuurPartners({ locale }: { locale?: Locale }) {
  if (!HUURPARTNERS.length) return null;
  return (
    <section className="mt-12">
      <h2 className="font-display font-extrabold text-2xl text-bosgroen-dk">Liever huren?</h2>
      <p className="text-grijs mt-1 max-w-2xl">Ook op vakantie in een recreatiewoning? Bekijk het aanbod van onze partners.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {HUURPARTNERS.map((p) => (
          <a
            key={p.naam}
            href={p.url}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="block bg-white border border-lijn rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-24 relative flex items-center justify-center" style={{ background: gradient(p.kleur ?? 2) }}>
              <span className="font-display font-extrabold text-white text-xl drop-shadow">{p.naam}</span>
              <span className="absolute top-2.5 right-2.5 bg-inkt/70 text-white font-display font-semibold text-[0.6rem] px-2 py-0.5 rounded-full">Advertentie</span>
            </div>
            <div className="p-3.5">
              <div className="text-sm text-grijs">{p.tekst}</div>
              <span className="text-sm text-bosgroen font-semibold mt-1.5 inline-block">Bekijk aanbod →</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
