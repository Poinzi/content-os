import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { setSeriesActive } from "@/lib/data";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json(
        { error: "Ei aktiivista organisaatiota" },
        { status: 401 },
      );
    }
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
