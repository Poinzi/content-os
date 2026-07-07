import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tenant";
import { revokeInvite } from "@/lib/data";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
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
  try {
    await revokeInvite(ctx.org.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[api/invites DELETE] Virhe:",
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json(
      { error: "Kutsun peruminen epäonnistui" },
      { status: 500 },
    );
  }
}
