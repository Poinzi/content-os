import type { Channel } from "@/lib/types";

/**
 * Vaihe 22: kanavariippumaton julkaisurajapinta. Moottori kutsuu näitä;
 * mock- ja tulevat oikeat adapterit (LinkedIn, Instagram jne.) toteuttavat ne.
 */

export interface PublishPayload {
  channel: Channel;
  text: string;
  mediaUrl?: string | null;
  variantId: string;
  itemTitle?: string | null;
}

export interface PublishResult {
  ok: boolean;
  externalId?: string;
  url?: string;
  error?: string;
}

export interface ChannelAdapter {
  /** Adapterin ensisijainen kanava (dokumentointia varten). */
  channel: Channel;
  publish(payload: PublishPayload): Promise<PublishResult>;
}
