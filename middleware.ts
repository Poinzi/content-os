import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Vaihe 1: middleware on placeholder. Kirjautuminen ja tenant-tarkistus lisätään
// myöhemmässä vaiheessa. Nyt vain propagoi pyyntö sellaisenaan.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
