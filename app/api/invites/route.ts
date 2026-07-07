import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tenant";
import { createInvite } from "@/lib/data";
import type { OrgRole } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_ROLES: OrgRole[] = ["admin", "editor"];

export async function POST(req: Request): Promise<NextResponse> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "forbidden") {
      return NextResponse.json(
        { error: "Vain ylläpitäjät voivat kutsua uusia jäseniä" },
        { status: 403 },
      );
    }
    return NextResponse.json({ error: "Kirjaudu sisään" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { email?: unknown; role?: unknown }
    | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const roleRaw = typeof body?.role === "string" ? body.role : "";
  const role = ALLOWED_ROLES.includes(roleRaw as OrgRole)
    ? (roleRaw as OrgRole)
    : ("editor" as OrgRole);
  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "Anna kelvollinen sähköposti" },
      { status: 400 },
    );
  }

  try {
    const { token } = await createInvite(
      ctx.org.id,
      email,
      role,
      ctx.user.id,
    );
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/invites POST] Virhe:", message);
    return NextResponse.json(
      { error: "Kutsun luonti epäonnistui" },
      { status: 500 },
    );
  }
}
