import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Taal-URL's: /en/* en /de/* worden intern herschreven naar de basisroute,
// met de taal in een request-header (x-locale) zodat server components 'm lezen.
// De URL in de browser blijft /en/... of /de/... — goed voor SEO (aparte URL's).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const seg = pathname.split("/")[1];
  const locale = seg === "en" || seg === "de" ? seg : "nl";
  const rest = locale === "nl" ? pathname : pathname.slice(locale.length + 1) || "/";

  const headers = new Headers(req.headers);
  headers.set("x-locale", locale);
  headers.set("x-pathname", rest);

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
