import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tenant";
import { updateBrandBrain } from "@/lib/data";
import type { BrandBrain } from "@/lib/types";

export const runtime = "nodejs";

interface PatchBody {
  writingStyle?: string;
  toneOfVoice?: string;
  values?: string;
  services?: BrandBrain["services"];
  targetAudiences?: string[];
  ctas?: string[];
}

export async function PATCH(req: Request): Promise<NextResponse> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "forbidden") {
      return NextResponse.json(
        { error: "Vain ylläpitäjät voivat muokata Brand Brainia" },
        { status: 403 },
      );
    }
    return NextResponse.json({ error: "Kirjaudu sisään" }, { status: 401 });
  }
  try {
    const raw = (await req.json().catch(() => null)) as PatchBody | null;
    if (!raw) {
      return NextResponse.json({ error: "Virheellinen JSON" }, { status: 400 });
    }
    const patch: PatchBody = {};
    if (typeof raw.writingStyle === "string") patch.writingStyle = raw.writingStyle;
    if (typeof raw.toneOfVoice === "string") patch.toneOfVoice = raw.toneOfVoice;
    if (typeof raw.values === "string") patch.values = raw.values;
    if (Array.isArray(raw.services)) {
      patch.services = raw.services
        .map((s) => ({
          name: String((s as { name?: unknown }).name ?? ""),
          description:
            typeof (s as { description?: unknown }).description === "string"
              ? String((s as { description?: unknown }).description)
              : undefined,
        }))
        .filter((s) => s.name);
    }
    if (Array.isArray(raw.targetAudiences)) {
      patch.targetAudiences = raw.targetAudiences.map(String).filter(Boolean);
    }
    if (Array.isArray(raw.ctas)) {
      patch.ctas = raw.ctas.map(String).filter(Boolean);
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "Ei muutettavia kenttiä" },
        { status: 400 },
      );
    }
    await updateBrandBrain(ctx.org.id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/brand-brain PATCH] Virhe:", message);
    return NextResponse.json(
      { error: "Tallennus epäonnistui", detail: message },
      { status: 500 },
    );
  }
}
