import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tenant";
import { setSeriesActive } from "@/lib/data";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "forbidden") {
      return NextResponse.json(
        { error: "Vain ylläpitäjät voivat muokata sarjoja" },
        { status: 403 },
      );
    }
    return NextResponse.json({ error: "Kirjaudu sisään" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => null)) as
      | { isActive?: boolean }
      | null;
    if (body === null || typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive (boolean) pakollinen" },
        { status: 400 },
      );
    }
    await setSeriesActive(ctx.org.id, id, body.isActive);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/brand-brain/series PATCH] Virhe:", message);
    return NextResponse.json(
      { error: "Sarjan päivitys epäonnistui", detail: message },
      { status: 500 },
    );
  }
}
