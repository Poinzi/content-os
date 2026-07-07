import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, gateEnabled, passwordToToken } from "@/lib/auth-gate";

/**
 * Vaihe 18: salasanaportti koko sovellukselle. Jos APP_PASSWORD ei ole
 * asetettu, päästetään kaikki läpi (portti pois päältä). Muuten kaikki
 * matcherin kattamat reitit vaativat co_auth-evästeen, jonka arvo täsmää
 * SHA-256-tokeniin salasanasta.
 *
 * Matcher jättää ulos /login, /api/login, /_next/*, /favicon.ico ja staattiset
 * assetit, jotta login-sivu ja sen POST-endpointti toimivat aina.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  if (!gateEnabled()) return NextResponse.next();

  const password = process.env.APP_PASSWORD!;
  const expected = await passwordToToken(password);
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;

  if (cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  const original = req.nextUrl.pathname + (req.nextUrl.search ?? "");
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(original)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/login|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp|avif|css|js|map|woff2?)$).*)",
  ],
};
