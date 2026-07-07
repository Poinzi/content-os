import type { Channel } from "@/lib/types";
import type { ChannelAdapter } from "@/lib/publishing/types";
import { mockAdapter } from "@/lib/publishing/adapters/mock";

/**
 * Vaihe 22: adapterirekisteri. Kaikki kanavat palautuvat mock-adapteriin
 * kunnes oikeat adapterit lisätään myöhemmissä vaiheissa (esim. LinkedIn OAuth).
 * Silloin voidaan palauttaa oikea adapteri kanavan mukaan; jos OAuth-tokenia ei
 * ole yhdistetty, fallback mockiin säilyy.
 */
export function getAdapter(_channel: Channel): ChannelAdapter {
  return mockAdapter;
}
