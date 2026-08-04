import { getBlogPosts } from "./blog";
import { getNieuwsbriefLeden, getLaatsteNieuwsbriefSlug, setLaatsteNieuwsbriefSlug, getLiveListings } from "./db";
import { sendEmail, renderNieuwsbrief } from "./email";
import { COMPANY } from "./company";
import { Listing } from "./types";

// Kies een paar aantrekkelijke woningen (uitgelicht eerst) per doel.
function kiesWoningen(doel: "koop" | "huur", n: number): Listing[] {
  return getLiveListings()
    .filter((l) => l.doel === doel)
    .sort((a, b) => (b.uitgelicht ? 1 : 0) - (a.uitgelicht ? 1 : 0))
    .slice(0, n)
    .map((l) => ({ ...l, fotos: l.fotos && l.fotos.length ? [l.fotos[0]] : undefined }));
}

// Verstuurt het nieuwste blogartikel naar alle nieuwsbrief-leden.
// force = ook versturen als het artikel al eerder verstuurd is.
export async function stuurNieuwsteBlog(force = false): Promise<{ verzonden: number; slug?: string; reden?: string }> {
  const post = getBlogPosts()[0];
  if (!post) return { verzonden: 0, reden: "geen artikel" };
  if (!force && getLaatsteNieuwsbriefSlug() === post.slug) {
    return { verzonden: 0, slug: post.slug, reden: "al verstuurd" };
  }
  const leden = getNieuwsbriefLeden();
  setLaatsteNieuwsbriefSlug(post.slug); // meteen markeren → voorkomt dubbel versturen
  const koop = kiesWoningen("koop", 4);
  const huur = kiesWoningen("huur", 3);
  let verzonden = 0;
  for (const lid of leden) {
    const afmeldUrl = `${COMPANY.website}/nieuwsbrief/afmelden?e=${encodeURIComponent(lid.email)}`;
    const { onderwerp, html } = renderNieuwsbrief(post, { afmeldUrl, koop, huur });
    try {
      await sendEmail({ aan: lid.email, onderwerp, soort: "nieuwsbrief", html });
      verzonden++;
    } catch {
      /* ga door met de rest */
    }
  }
  return { verzonden, slug: post.slug };
}

// Baseline zetten zonder te versturen (bij eerste keer), zodat oude artikelen
// niet alsnog de deur uitgaan.
export function markeerHuidigeBlogAlsBasis(): void {
  const post = getBlogPosts()[0];
  if (post && getLaatsteNieuwsbriefSlug() === undefined) setLaatsteNieuwsbriefSlug(post.slug);
}
