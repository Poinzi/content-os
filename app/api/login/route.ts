import { NextResponse } from "next/server";
import { AUTH_COOKIE, gateEnabled, passwordToToken } from "@/lib/auth-gate";

export const runtime = "nodejs";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

/**
 * Vaihe 18: kirjautuminen. Vertaa raakaa salasanaa APP_PASSWORDiin, ja jos
 * ok, asettaa httpOnly-evästeen jossa on salasanan SHA-256-token (ei raakaa).
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as
    | { password?: unknown }
    | null;

  if (!gateEnabled()) {
    // Portti pois päältä → ei tarvetta kirjautua.
    return NextResponse.json({ ok: true, gateEnabled: false });
  }

  const password = typeof body?.password === "string" ? body.password : "";
  if (password === "" || password !== process.env.APP_PASSWORD) {
    return NextResponse.json(
      { error: "Väärä salasana" },
      { status: 401 },
    );
  }

  const token = await passwordToToken(password);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
  return res;
}

/**
 * Uloskirjautuminen: tyhjentää evästeen.
 */
export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: AUTH_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
