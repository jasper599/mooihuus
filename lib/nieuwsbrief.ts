import { getBlogPosts } from "./blog";
import { getNieuwsbriefLeden, getLaatsteNieuwsbriefSlug, setLaatsteNieuwsbriefSlug } from "./db";
import { sendEmail, renderNieuwsbrief } from "./email";
import { COMPANY } from "./company";

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
  let verzonden = 0;
  for (const lid of leden) {
    const afmeldUrl = `${COMPANY.website}/nieuwsbrief/afmelden?e=${encodeURIComponent(lid.email)}`;
    const { onderwerp, html } = renderNieuwsbrief(post, afmeldUrl);
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
