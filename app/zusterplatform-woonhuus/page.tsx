import type { Metadata } from "next";
import { PlatformUitleg } from "@/components/PlatformUitleg";

export const metadata: Metadata = {
  title: "Ons zusterplatform Woonhuus.nl",
  description: "Mooihuus is er voor recreatiewoningen, Woonhuus.nl voor gewone koopwoningen. Lees hoe beide platformen samenwerken.",
  alternates: { canonical: "/zusterplatform-woonhuus" },
};

export default function ZusterplatformWoonhuus() {
  return <PlatformUitleg hier="mooihuus" />;
}
