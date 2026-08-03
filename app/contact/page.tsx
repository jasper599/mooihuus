import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact — Mooihuus",
  description: "Vragen over adverteren, je account, verhuur via Belvilla of de Huusmeesters? Neem contact op met Mooihuus.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage({ searchParams }: { searchParams?: { onderwerp?: string } }) {
  const onderwerp = searchParams?.onderwerp ? String(searchParams.onderwerp) : "";
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk">Contact</h1>
      <p className="text-grijs mt-2 max-w-2xl">
        Een vraag over adverteren, je account, verhuur via Belvilla of de Huusmeesters? Stuur ons
        gerust een bericht — we helpen je graag verder. Je hoort meestal binnen één werkdag van ons.
      </p>

      <div className="grid gap-6 md:grid-cols-[1fr_260px] mt-6">
        <div className="card">
          <ContactForm knop="Verstuur bericht" defaultOnderwerp={onderwerp} />
        </div>
        <aside className="card bg-creme">
          <h2 className="font-display font-bold text-bosgroen-dk">Mooihuus</h2>
          <p className="text-sm text-grijs mt-2 leading-relaxed">
            {COMPANY.handelsnaam}<br />
            {COMPANY.bv}<br />
            {COMPANY.adres}<br />
            {COMPANY.postcode}
          </p>
          <p className="text-sm mt-3">
            <a href={`mailto:${COMPANY.email}`} className="text-bosgroen font-semibold hover:underline">{COMPANY.email}</a>
          </p>
          <p className="text-xs text-grijs mt-3">
            KvK {COMPANY.kvk}<br />
            btw {COMPANY.btw}
          </p>
        </aside>
      </div>
    </div>
  );
}
