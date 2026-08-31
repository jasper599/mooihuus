import { LAATST_BIJGEWERKT } from "@/lib/company";

export function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="legal mx-auto">
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">{title}</h1>
      <p className="text-grijs text-sm mt-1 mb-6">Laatst bijgewerkt: {LAATST_BIJGEWERKT}</p>
      {children}
    </div>
  );
}
