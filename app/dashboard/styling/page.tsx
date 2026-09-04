import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AiStyler } from "@/components/AiStyler";
import { stylingBeschikbaar } from "@/lib/ai-styling";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI virtuele styling — Mooihuus",
  robots: { index: false, follow: false },
};

export default async function StylingPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) redirect("/inloggen");
  const aan = stylingBeschikbaar();

  return (
    <div className="max-w-3xl mx-auto">
      <span className="inline-block bg-salie-lt text-bosgroen-dk font-display font-semibold text-xs px-3 py-1 rounded-full">Nieuw · beta</span>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bosgroen-dk mt-2">AI virtuele styling</h1>
      <p className="text-grijs mt-2 max-w-2xl">
        Upload een foto van een ruimte, kies een stijl, en krijg een AI-impressie hoe de woning eruit zou kunnen zien —
        handig om kopers door een gedateerd interieur heen te laten kijken. De indeling (muren, ramen) blijft behouden;
        alleen de aankleding verandert.
      </p>

      <div className="mt-6">
        {aan ? (
          <AiStyler />
        ) : (
          <div className="card text-grijs">
            AI-styling staat nog uit. Er is nog geen API-sleutel ingesteld (<code>REPLICATE_API_TOKEN</code>). Zodra die
            is toegevoegd, kun je hier direct impressies genereren.
          </div>
        )}
      </div>
    </div>
  );
}
