import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { updateContentItemStatus } from "@/lib/data";
import type { ContentStatus } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_STATUSES: ContentStatus[] = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "archived",
];

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
      | { status?: ContentStatus }
      | null;
    if (!body?.status || !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: "status pakollinen ja validi" },
        { status: 400 },
      );
    }
    await updateContentItemStatus(ctx.org.id, id, body.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/content/PATCH] Virhe:", message);
    return NextResponse.json(
      { error: "Tilan päivitys epäonnistui", detail: message },
      { status: 500 },
    );
  }
}
