import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tenant";
import { removeMember } from "@/lib/data";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: targetUserId } = await params;
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "forbidden") {
      return NextResponse.json({ error: "Ei oikeuksia" }, { status: 403 });
    }
    return NextResponse.json({ error: "Kirjaudu sisään" }, { status: 401 });
  }
  if (targetUserId === ctx.user.id) {
    return NextResponse.json(
      { error: "Et voi poistaa itseäsi" },
      { status: 400 },
    );
  }
  try {
    await removeMember(ctx.org.id, targetUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "last-admin") {
      return NextResponse.json(
        { error: "Vähintään yksi ylläpitäjä on säilytettävä" },
        { status: 400 },
      );
    }
    console.error("[api/members DELETE] Virhe:", message);
    return NextResponse.json(
      { error: "Jäsenen poisto epäonnistui" },
      { status: 500 },
    );
  }
}
