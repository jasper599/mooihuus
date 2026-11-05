import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { siteVanHost, WOONHUUS_EIGEN_PADEN, MOOIHUUS_URL, WOONHUUS_URL, ACCOUNT_PADEN, ETALAGE_COOKIE } from "./lib/site";

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
      // Naar Mooihuus.nl; accountpagina's blijven daar in Woonhuus-stijl.
      const sp = new URLSearchParams(search);
      if (ACCOUNT_PADEN.some((re) => re.test(pathname))) sp.set("via", "woonhuus");
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return NextResponse.redirect(`${MOOIHUUS_URL}${pathname}${qs}`, 307);
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

  // Woonhuus-stijl op de accountpagina's voor wie vanaf Woonhuus.nl komt.
  const via = req.nextUrl.searchParams.get("via");
  const viaWoonhuus = via === "woonhuus" || req.nextUrl.searchParams.get("categorie") === "woonhuis";
  let etalage = req.cookies.get(ETALAGE_COOKIE)?.value === "woonhuus" ? "woonhuus" : "";
  let zetCookie: "woonhuus" | "wis" | null = null;
  if (viaWoonhuus) { etalage = "woonhuus"; zetCookie = "woonhuus"; }
  // Wie bewust Mooihuus opent (homepage of ?via=mooihuus), krijgt weer de Mooihuus-stijl.
  if (via === "mooihuus" || (rest === "/" && !viaWoonhuus)) { if (etalage) zetCookie = "wis"; etalage = ""; }
  if (etalage === "woonhuus" && locale === "nl" && ACCOUNT_PADEN.some((re) => re.test(rest))) headers.set("x-skin", "woonhuus");

  let res: NextResponse;
  if (locale !== "nl") {
    const url = req.nextUrl.clone();
    url.pathname = rest;
    res = NextResponse.rewrite(url, { request: { headers } });
  } else {
    res = NextResponse.next({ request: { headers } });
  }
  if (zetCookie === "woonhuus") res.cookies.set(ETALAGE_COOKIE, "woonhuus", { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", secure: true });
  if (zetCookie === "wis") res.cookies.delete(ETALAGE_COOKIE);
  return res;
}

export const config = {
  // Sla API, next-internals en bestanden (met punt, zoals robots.txt) over.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
