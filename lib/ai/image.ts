const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/**
 * Hae kuva palvelimella ja palauta se base64-lähteenä. Näin Anthropicin ei
 * tarvitse itse ladata kuvaa ulkoisesta URL:sta (poistaa "Unable to download"
 * 400-virheet Unsplash rate limitin tai hotlink-suojauksen takia).
 *
 * Vaatii Node-runtime (fetch + Buffer). API-routet joissa tätä käytetään
 * käyttävät jo `export const runtime = "nodejs"`.
 */
export async function fetchImageAsBase64(
  url: string,
): Promise<{ mediaType: AllowedImageType; data: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Kuvan lataus epäonnistui (HTTP ${res.status})`);
  }
  const rawType = (res.headers.get("content-type") ?? "image/jpeg")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const mediaType: AllowedImageType = (
    ALLOWED_IMAGE_TYPES as readonly string[]
  ).includes(rawType)
    ? (rawType as AllowedImageType)
    : "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  // Anthropicin raja on ~5 MB / kuva. Thumbnailit ovat pieniä mutta varmistetaan.
  if (buf.byteLength > 5 * 1024 * 1024) {
    throw new Error("Kuva on liian suuri analyysiin (> 5 MB)");
  }
  return { mediaType, data: buf.toString("base64") };
}
