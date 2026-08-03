import { LAATST_BIJGEWERKT } from "@/lib/company";

export function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="legal mx-auto">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">{title}</h1>
      <p className="text-grijs text-sm mt-1 mb-4">Laatst bijgewerkt: {LAATST_BIJGEWERKT}</p>
      <div className="bg-[#FBEEE4] border-l-4 border-oranje rounded-xl p-3.5 text-sm mb-6">
        <strong>Let op:</strong> dit is een concepttekst als startpunt. Laat de definitieve
        juridische documenten controleren door een jurist voordat je live gaat.
      </div>
      {children}
    </div>
  );
}
