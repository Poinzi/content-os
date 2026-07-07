import { NextResponse } from "next/server";
import { acceptInvite } from "@/lib/data";
import { SESSION_COOKIE, authEnabled, signSession } from "@/lib/auth";

export const runtime = "nodejs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

/**
 * Vaihe 20: kutsulinkin hyväksyminen. Julkinen (ei admin-suojausta) — token
 * itsessään on auth.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const raw = (await req.json().catch(() => null)) as
    | { token?: unknown; name?: unknown; password?: unknown }
    | null;
  const token = typeof raw?.token === "string" ? raw.token : "";
  const name = typeof raw?.name === "string" ? raw.name : "";
  const password = typeof raw?.password === "string" ? raw.password : "";
  if (!token || password.length < 8) {
    return NextResponse.json(
      { error: "Salasanan on oltava vähintään 8 merkkiä" },
      { status: 400 },
    );
  }
  try {
    const result = await acceptInvite(token, { name, password });
    if ("error" in result) {
      if (result.error === "exists") {
        return NextResponse.json(
          { error: "Tunnus on jo olemassa — kirjaudu sisään" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Kutsu ei ole voimassa" },
        { status: 400 },
      );
    }

    // Rakennetaan istunto vain kun auth on päällä (SESSION_SECRET asetettu).
    // Muutoin käyttäjä on demo-tilassa eikä kirjautumista tarvita.
    if (!authEnabled()) {
      return NextResponse.json({ ok: true, authEnabled: false });
    }
    const jwt = await signSession({
      uid: result.userId,
      oid: result.orgId,
      role: result.role,
      exp: Date.now() + THIRTY_DAYS_MS,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: SESSION_COOKIE,
      value: jwt,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: THIRTY_DAYS_SECONDS,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/join POST] Virhe:", message);
    return NextResponse.json(
      { error: "Liittyminen epäonnistui" },
      { status: 500 },
    );
  }
}
