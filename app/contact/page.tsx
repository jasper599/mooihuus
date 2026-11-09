import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { huidigeSite } from "@/lib/site-server";
import { COMPANY } from "@/lib/company";

// Elk uur opnieuw opbouwen, zodat o.a. het adres na de verhuizing (15-12-2026) vanzelf klopt.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact",
  description: "Vragen over adverteren, je account, verhuur of de Huusmeesters? Neem contact op met Mooihuus.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage({ searchParams }: { searchParams?: { onderwerp?: string } }) {
  const onderwerp = searchParams?.onderwerp ? String(searchParams.onderwerp) : "";
  const woonhuus = huidigeSite() === "woonhuus";
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk">Contact</h1>
      <p className="text-grijs mt-2 max-w-2xl">
        {woonhuus ? "Een vraag over een woning, adverteren of je account? Stuur ons" : "Een vraag over adverteren, je account, verhuur of de Huusmeesters? Stuur ons"}
        gerust een bericht. We helpen je graag verder en je hoort meestal binnen één werkdag van ons.
      </p>

      <div className="grid gap-6 md:grid-cols-[1fr_260px] mt-6">
        <div className="card">
          <ContactForm knop="Verstuur bericht" defaultOnderwerp={onderwerp} />
        </div>
        <aside className="card bg-creme">
          <h2 className="font-display font-bold text-bosgroen-dk">{woonhuus ? "Woonhuus" : "Mooihuus"}</h2>
          <p className="text-sm text-grijs mt-2 leading-relaxed">
            {woonhuus ? "Woonhuus.nl (onderdeel van Mooihuus.nl)" : COMPANY.handelsnaam}<br />
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
