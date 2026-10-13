import { getBlogPosts } from "./blog";
import {
  getNieuwsbriefLeden, getLaatsteNieuwsbriefSlug, setLaatsteNieuwsbriefSlug,
  getLaatsteNieuwsbriefTijd, setLaatsteNieuwsbriefTijd, getLiveListings,
} from "./db";
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
// Harde grendel: nooit twee nieuwsbrieven binnen dit aantal uur — ook niet met
// force. Beschermt tegen dubbelklik/dubbele submit op de beheer-knop.
const MIN_INTERVAL_UUR = 20;

export async function stuurNieuwsteBlog(force = false): Promise<{ verzonden: number; slug?: string; reden?: string }> {
  const post = getBlogPosts()[0];
  if (!post) return { verzonden: 0, reden: "geen artikel" };

  // 1) Tijdsgrendel die zelfs force NIET omzeilt: binnen MIN_INTERVAL_UUR na de
  //    vorige verzending wordt niets verstuurd. Dit is de harde stop tegen de
  //    dubbele nieuwsbrief.
  const laatst = getLaatsteNieuwsbriefTijd();
  if (laatst) {
    const urenGeleden = (Date.now() - new Date(laatst).getTime()) / 3_600_000;
    if (Number.isFinite(urenGeleden) && urenGeleden < MIN_INTERVAL_UUR) {
      return {
        verzonden: 0,
        slug: post.slug,
        reden: `geblokkeerd: ${Math.max(0, Math.round(urenGeleden))} uur geleden al een nieuwsbrief verstuurd (minimaal ${MIN_INTERVAL_UUR} uur ertussen)`,
      };
    }
  }

  // 2) Zelfde artikel al verstuurd? Alleen met force opnieuw (bv. bewust).
  if (!force && getLaatsteNieuwsbriefSlug() === post.slug) {
    return { verzonden: 0, slug: post.slug, reden: "al verstuurd" };
  }

  const leden = getNieuwsbriefLeden();
  // Meteen markeren (tijd én slug) VÓÓR het versturen → een snelle tweede
  // aanroep valt direct op de tijdsgrendel hierboven.
  setLaatsteNieuwsbriefTijd(new Date().toISOString());
  setLaatsteNieuwsbriefSlug(post.slug);
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
