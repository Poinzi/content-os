import { NextResponse } from "next/server";
import {
  authEnabled,
  SESSION_COOKIE,
  signSession,
  verifyPassword,
} from "@/lib/auth";
import { getMembershipsForUser, getUserByEmail } from "@/lib/data";

export const runtime = "nodejs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

/**
 * Vaihe 19: kirjautuminen.
 * - Demo-tila: palauta { ok: true } (ei suojausta).
 * - Auth ON: verifioi email+password, luo istunto-token ja aseta eväste.
 * Sama virheviesti sekä väärälle sähköpostille että väärälle salasanalle
 * (ei paljasteta kumpi).
 */
export async function POST(req: Request): Promise<NextResponse> {
  const raw = (await req.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;

  if (!authEnabled()) {
    return NextResponse.json({ ok: true, authEnabled: false });
  }

  const email =
    typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw?.password === "string" ? raw.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Väärä sähköposti tai salasana" },
      { status: 401 },
    );
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Väärä sähköposti tai salasana" },
        { status: 401 },
      );
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Väärä sähköposti tai salasana" },
        { status: 401 },
      );
    }

    const memberships = await getMembershipsForUser(user.id);
    if (memberships.length === 0) {
      return NextResponse.json(
        { error: "Ei organisaatiota" },
        { status: 403 },
      );
    }
    const active = memberships[0];
    const token = await signSession({
      uid: user.id,
      oid: active.organization.id,
      role: active.role,
      exp: Date.now() + THIRTY_DAYS_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: THIRTY_DAYS_SECONDS,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/login POST] Virhe:", message);
    return NextResponse.json(
      { error: "Kirjautuminen epäonnistui" },
      { status: 500 },
    );
  }
}

/**
 * Uloskirjautuminen: tyhjennä istunto-eväste.
 */
export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
