import type { ChannelAdapter, PublishResult } from "@/lib/publishing/types";

/**
 * Vaihe 22: mock-adapteri. Ei ulkoista kutsua, palauttaa aina onnistumisen.
 * Käytössä kunnes oikeat kanava-adapterit (LinkedIn, IG, TikTok) tulevat.
 */
export const mockAdapter: ChannelAdapter = {
  channel: "blog",
  async publish(p): Promise<PublishResult> {
    const externalId = `mock_${p.variantId}_${Date.now()}`;
    return {
      ok: true,
      externalId,
      url: `https://example.invalid/${externalId}`,
    };
  },
};
