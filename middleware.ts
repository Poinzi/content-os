import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * Vaihe 19: istuntopohjainen middleware.
 * - Auth OFF (SESSION_SECRET puuttuu tai mock-tila): kaikki läpi (demo).
 * - Auth ON: vaadi kelvollinen SESSION_COOKIE. Ilman → redirect /login?next=...
 *
 * Ei DB-hakuja täällä — vain HMAC-tarkistus, jotta middleware toimii edge-
 * runtimessa. Matcher jättää ulos /login, /api/login, staattiset assetit.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  if (!authEnabled()) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const url = req.nextUrl.clone();
  const original = req.nextUrl.pathname + (req.nextUrl.search ?? "");
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(original)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Ohita: _next-tiedostot, favicon, /login, /api/login, /join/*, /api/join,
    // sekä yleiset staattiset assetit. Näihin ei koskaan vaadita istuntoa.
    "/((?!_next/static|_next/image|favicon.ico|login|api/login|join|api/join|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp|avif|css|js|map|woff2?)$).*)",
  ],
};
