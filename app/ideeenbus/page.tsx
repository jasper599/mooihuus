import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import { Locale } from "@/lib/i18n";
import { IdeeForm, IdeeLabels } from "@/components/IdeeForm";

export const metadata: Metadata = {
  title: "Ideeënbus — Mooihuus",
  description:
    "Heb je een idee of een op- of aanmerking voor Mooihuus? Deel het hier. Samen maken we Mooihuus beter en vindbaar voor iedereen.",
};

type Content = {
  kicker: string;
  title: string;
  intro: string;
  uitleg: string;
  labels: IdeeLabels;
};

const CONTENT: Record<Locale, Content> = {
  nl: {
    kicker: "Ideeënbus",
    title: "Heb je een goed idee voor Mooihuus?",
    intro:
      "Een tip, een idee, of gewoon iets dat beter kan. We lezen alles. Samen maken we Mooihuus beter en vindbaar voor iedereen.",
    uitleg: "Je hoeft geen naam of e-mail achter te laten. Wil je dat we kunnen reageren, vul dan je e-mail in.",
    labels: {
      naamPlaceholder: "Je naam",
      emailPlaceholder: "Je e-mailadres",
      optieIdee: "💡 Ik heb een idee",
      optieOpmerking: "💬 Ik heb een op- of aanmerking",
      tekstPlaceholder: "Vertel het ons…",
      knop: "Versturen",
      bezig: "Versturen…",
      dank: "Dank je wel! Je idee is binnen. We lezen elke inzending.",
      fout: "Er ging iets mis.",
      optioneel: "optioneel",
    },
  },
  en: {
    kicker: "Idea box",
    title: "Got a good idea for Mooihuus?",
    intro:
      "A tip, an idea, or just something that could be better. We read everything. Together we make Mooihuus better for everyone.",
    uitleg: "You don't have to leave a name or email. Want us to be able to reply? Add your email.",
    labels: {
      naamPlaceholder: "Your name",
      emailPlaceholder: "Your email",
      optieIdee: "💡 I have an idea",
      optieOpmerking: "💬 I have a comment",
      tekstPlaceholder: "Tell us…",
      knop: "Send",
      bezig: "Sending…",
      dank: "Thank you! Your idea is in. We read every submission.",
      fout: "Something went wrong.",
      optioneel: "optional",
    },
  },
  de: {
    kicker: "Ideenbox",
    title: "Hast du eine gute Idee für Mooihuus?",
    intro:
      "Ein Tipp, eine Idee oder einfach etwas, das besser sein könnte. Wir lesen alles. Gemeinsam machen wir Mooihuus besser für alle.",
    uitleg: "Du musst keinen Namen oder keine E-Mail hinterlassen. Sollen wir antworten können? Dann gib deine E-Mail an.",
    labels: {
      naamPlaceholder: "Dein Name",
      emailPlaceholder: "Deine E-Mail",
      optieIdee: "💡 Ich habe eine Idee",
      optieOpmerking: "💬 Ich habe eine Anmerkung",
      tekstPlaceholder: "Erzähl es uns…",
      knop: "Senden",
      bezig: "Senden…",
      dank: "Danke! Deine Idee ist angekommen. Wir lesen jede Einsendung.",
      fout: "Etwas ist schiefgelaufen.",
      optioneel: "optional",
    },
  },
};

export default function Ideeenbus() {
  const locale = getLocale();
  const c = CONTENT[locale] ?? CONTENT.nl;

  return (
    <div className="max-w-xl">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-oranje-dk mb-2">{c.kicker}</div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">{c.title}</h1>
      <p className="text-grijs mt-2 mb-6">{c.intro}</p>

      <div className="card">
        <IdeeForm labels={c.labels} />
      </div>

      <p className="text-grijs text-xs mt-3">{c.uitleg}</p>
    </div>
  );
}
