import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { siteVanHost, WOONHUUS_EIGEN_PADEN, MOOIHUUS_URL, WOONHUUS_URL } from "./lib/site";

// Taal-URL's: /en/* en /de/* worden intern herschreven naar de basisroute,
// met de taal in een request-header (x-locale) zodat server components 'm lezen.
// De URL in de browser blijft /en/... of /de/... — goed voor SEO (aparte URL's).
//
// Etalage: op woonhuus.nl zet de middleware x-site=woonhuus. De eigen pagina's
// van Woonhuus (home, huren, te koop per provincie) staan onder /woonhuus/* en
// worden hier intern naartoe herschreven. Paden die alleen bij Mooihuus horen
// (inloggen, dashboard, plaatsen, beheer, ...) gaan naar mooihuus.nl.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const site = siteVanHost(req.headers.get("host"));

  if (site === "woonhuus") {
    // Woonhuus is (voorlopig) alleen Nederlandstalig.
    const seg0 = pathname.split("/")[1];
    if (seg0 === "en" || seg0 === "de") {
      return NextResponse.redirect(`${WOONHUUS_URL}${pathname.slice(seg0.length + 1) || "/"}${search}`, 308);
    }
    // Woonhuus toont alleen koopwoningen; de oude huurpagina wijst naar de home.
    if (pathname === "/huren") return NextResponse.redirect(`${WOONHUUS_URL}/`, 308);
    if (!WOONHUUS_EIGEN_PADEN.some((re) => re.test(pathname))) {
      return NextResponse.redirect(`${MOOIHUUS_URL}${pathname}${search}`, 307);
    }
    const headers = new Headers(req.headers);
    headers.set("x-locale", "nl");
    headers.set("x-pathname", pathname);
    headers.set("x-site", "woonhuus");
    const intern =
      pathname === "/" ? "/woonhuus" :
      pathname.startsWith("/te-koop") ? `/woonhuus${pathname}` :
      pathname === "/over-woonhuus" ? "/woonhuus/over" :
      pathname === "/over-mooihuus" ? "/woonhuus/over-mooihuus" : null;
    if (intern) {
      const url = req.nextUrl.clone();
      url.pathname = intern;
      return NextResponse.rewrite(url, { request: { headers } });
    }
    return NextResponse.next({ request: { headers } });
  }

  // Mooihuus: de interne Woonhuus-routes zijn hier niet bereikbaar.
  if (pathname === "/woonhuus" || pathname.startsWith("/woonhuus/")) {
    const rest = pathname.replace(/^\/woonhuus/, "") || "/";
    return NextResponse.redirect(`${WOONHUUS_URL}${rest === "/over" ? "/over-woonhuus" : rest === "/over-mooihuus" ? "/over-mooihuus" : rest}${search}`, 307);
  }

  const seg = pathname.split("/")[1];
  const locale = seg === "en" || seg === "de" ? seg : "nl";
  const rest = locale === "nl" ? pathname : pathname.slice(locale.length + 1) || "/";

  const headers = new Headers(req.headers);
  headers.set("x-locale", locale);
  headers.set("x-pathname", rest);
  headers.set("x-site", "mooihuus");

  if (locale !== "nl") {
    const url = req.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Sla API, next-internals en bestanden (met punt, zoals robots.txt) over.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
