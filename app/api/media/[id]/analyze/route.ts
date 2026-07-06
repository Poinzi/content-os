import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { getBrandBrain, getMedia, setMediaAnalysis } from "@/lib/data";
import { analyzeMedia, demoAnalysis } from "@/lib/ai/analyze-media";
import { isAIEnabled } from "@/lib/ai/anthropic";

export const runtime = "nodejs"; // pg vaatii Node-ajon, ei edge

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

    // Fallback: ei AI-avainta tai mock-tilassa -> demo-analyysi
    if (!isAIEnabled || process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
      return NextResponse.json({
        analysis: demoAnalysis(asset, brand),
        demo: true,
      });
    }

    const analysis = await analyzeMedia(asset, brand);
    await setMediaAnalysis(ctx.org.id, asset.id, analysis);
    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/media/analyze] Virhe:", message);
    return NextResponse.json(
      { error: "Analyysi epäonnistui", detail: message },
      { status: 500 },
    );
  }
}
