import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import {
  createGeneratedContent,
  getBrandBrain,
  getMedia,
} from "@/lib/data";
import { generateContent, demoContent } from "@/lib/ai/generate-content";
import { isAIEnabled, TEXT_MODEL } from "@/lib/ai/anthropic";
import type { Channel } from "@/lib/types";

export const runtime = "nodejs";

const CHANNELS: Channel[] = [
  "tiktok",
  "instagram",
  "facebook",
  "linkedin",
  "blog",
];

export async function POST(
  _request: Request,
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

    const [media, brand] = await Promise.all([
      getMedia(ctx.org.id),
      getBrandBrain(ctx.org.id),
    ]);

    const asset = media.find((m) => m.id === id);
    if (!asset) {
      return NextResponse.json(
        { error: "Media-asset ei löytynyt" },
        { status: 404 },
      );
    }

    // Fallback: ei AI-avainta tai mock-tilassa -> demo-tulos
    if (!isAIEnabled || process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
      return NextResponse.json({
        generated: demoContent(asset, brand, CHANNELS),
        contentItemId: "demo-content",
        demo: true,
      });
    }

    // Vaadi analyysi ensin — pidetään vastuut erillään
    if (!asset.analysis) {
      return NextResponse.json(
        {
          error:
            "Analysoi media ensin — sisällöntuotanto perustuu Vision-analyysiin.",
        },
        { status: 409 },
      );
    }

    const generated = await generateContent({
      asset,
      analysis: asset.analysis,
      brand,
      orgName: ctx.org.name,
      channels: CHANNELS,
    });

    const { contentItemId } = await createGeneratedContent(ctx.org.id, {
      mediaAssetId: asset.id,
      seriesName: null,
      generated,
      aiModel: TEXT_MODEL,
    });

    return NextResponse.json({ generated, contentItemId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/media/generate] Virhe:", message);
    return NextResponse.json(
      { error: "Sisällöntuotanto epäonnistui", detail: message },
      { status: 500 },
    );
  }
}
