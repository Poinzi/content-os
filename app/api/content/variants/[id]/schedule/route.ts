import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import {
  scheduleVariant,
  unscheduleVariant,
  markVariantPublished,
} from "@/lib/data";

export const runtime = "nodejs";

/**
 * POST body: { scheduledAt: string (ISO) } → ajastaa variantin.
 */
export async function POST(
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
      | { scheduledAt?: string }
      | null;
    const raw = body?.scheduledAt;
    if (typeof raw !== "string" || !raw) {
      return NextResponse.json(
        { error: "scheduledAt pakollinen (ISO-8601)" },
        { status: 400 },
      );
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "scheduledAt ei ole kelvollinen päivämäärä" },
        { status: 400 },
      );
    }
    await scheduleVariant(ctx.org.id, id, parsed.toISOString());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/content/variants/schedule POST] Virhe:", message);
    return NextResponse.json(
      { error: "Ajastus epäonnistui", detail: message },
      { status: 500 },
    );
  }
}

/**
 * DELETE → peru ajastus, variantti takaisin approved-tilaan.
 */
export async function DELETE(
  _req: Request,
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
    await unscheduleVariant(ctx.org.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/content/variants/schedule DELETE] Virhe:", message);
    return NextResponse.json(
      { error: "Ajastuksen peruminen epäonnistui", detail: message },
      { status: 500 },
    );
  }
}

/**
 * PATCH body: { action: "publish" } → merkitse julkaistuksi.
 */
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
      | { action?: string }
      | null;
    if (body?.action !== "publish") {
      return NextResponse.json(
        { error: 'action tulee olla "publish"' },
        { status: 400 },
      );
    }
    await markVariantPublished(ctx.org.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/content/variants/schedule PATCH] Virhe:", message);
    return NextResponse.json(
      { error: "Julkaisumerkintä epäonnistui", detail: message },
      { status: 500 },
    );
  }
}
