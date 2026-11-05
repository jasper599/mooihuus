import type { Metadata } from "next";
import { PlatformUitleg } from "@/components/PlatformUitleg";

export const metadata: Metadata = {
  title: "Ons zusterplatform Mooihuus.nl",
  description: "Woonhuus is er voor gewone koopwoningen, Mooihuus.nl voor recreatiewoningen. Lees hoe beide platformen samenwerken.",
  alternates: { canonical: "/over-mooihuus" },
};

export default function OverMooihuus() {
  return <PlatformUitleg hier="woonhuus" />;
}
