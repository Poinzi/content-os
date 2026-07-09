import type {
  ChannelAdapter,
  PublishPayload,
  PublishResult,
} from "@/lib/publishing/types";

/**
 * Vaihe 23: Facebook (Meta Graph API) -adapteri. Julkaisee sivulle jonka ID on
 * FACEBOOK_PAGE_ID käyttäen pitkäikäistä Page Access Tokenia
 * (FACEBOOK_PAGE_ACCESS_TOKEN). Salaisuudet vain env:istä — ei koskaan koodiin.
 *
 * Jos mediaUrl on julkinen http(s)-URL, käytetään /photos-endpointtia. Muuten
 * teksti-only /feed. Tämä välttää base64-mediauri:t joita nykyinen data-kerros
 * voi palauttaa.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

function isPublicHttpUrl(u?: string | null): u is string {
  return !!u && /^https?:\/\//i.test(u);
}

interface GraphError {
  message?: string;
  type?: string;
  code?: number;
}

interface GraphResponse {
  id?: string;
  post_id?: string;
  error?: GraphError;
}

export const facebookAdapter: ChannelAdapter = {
  channel: "facebook",
  async publish(p: PublishPayload): Promise<PublishResult> {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!pageId || !token) {
      return { ok: false, error: "facebook not configured" };
    }

    const message = (p.text ?? "").trim();
    const useImage = isPublicHttpUrl(p.mediaUrl);
    const endpoint = useImage
      ? `${GRAPH}/${encodeURIComponent(pageId)}/photos`
      : `${GRAPH}/${encodeURIComponent(pageId)}/feed`;

    const params = new URLSearchParams();
    params.set("access_token", token);
    if (useImage) {
      params.set("url", p.mediaUrl as string);
      if (message) params.set("caption", message);
    } else {
      if (!message) {
        return { ok: false, error: "facebook: tyhjä teksti" };
      }
      params.set("message", message);
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: params,
      });
      const data = (await res.json().catch(() => ({}))) as GraphResponse;

      if (!res.ok || data.error) {
        const msg = data.error?.message ?? `HTTP ${res.status}`;
        return { ok: false, error: `facebook: ${msg}` };
      }

      const externalId = data.post_id ?? data.id;
      const url = externalId
        ? `https://www.facebook.com/${externalId}`
        : undefined;
      return { ok: true, externalId, url };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `facebook: ${message}` };
    }
  },
};
