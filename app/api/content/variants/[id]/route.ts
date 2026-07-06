import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { updateContentVariant } from "@/lib/data";
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

interface PatchBody {
  body?: string;
  hashtags?: string[];
  cta?: string;
  status?: ContentStatus;
}

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
    const raw = (await req.json().catch(() => null)) as PatchBody | null;
    if (!raw) {
      return NextResponse.json({ error: "Virheellinen JSON" }, { status: 400 });
    }
    const patch: PatchBody = {};
    if (typeof raw.body === "string") patch.body = raw.body;
    if (typeof raw.cta === "string") patch.cta = raw.cta;
    if (Array.isArray(raw.hashtags)) {
      patch.hashtags = raw.hashtags.map((h) => String(h)).filter(Boolean);
    }
    if (raw.status && ALLOWED_STATUSES.includes(raw.status)) {
      patch.status = raw.status;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "Ei muutettavia kenttiä" },
        { status: 400 },
      );
    }
    await updateContentVariant(ctx.org.id, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/content/variants/PATCH] Virhe:", message);
    return NextResponse.json(
      { error: "Variantin päivitys epäonnistui", detail: message },
      { status: 500 },
    );
  }
}
