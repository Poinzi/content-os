import type { Channel } from "@/lib/types";
import type { ChannelAdapter } from "@/lib/publishing/types";
import { mockAdapter } from "@/lib/publishing/adapters/mock";
import { facebookAdapter } from "@/lib/publishing/adapters/facebook";

/**
 * Vaihe 22–23: adapterirekisteri. Kanavat, joille on konfiguroitu oikeat
 * tunnukset, saavat oikean adapterin. Muut → mock, joka teeskentelee
 * onnistuneen julkaisun. Näin demo- ja local-dev toimivat ilman salaisuuksia.
 */

function facebookConfigured(): boolean {
  return (
    !!process.env.FACEBOOK_PAGE_ID &&
    !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  );
}

export function getAdapter(channel: Channel): ChannelAdapter {
  if (channel === "facebook" && facebookConfigured()) {
    return facebookAdapter;
  }
  return mockAdapter;
}
