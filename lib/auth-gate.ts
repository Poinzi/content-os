/**
 * Vaihe 18: kevyt salasanaportti. Yksi jaettu salasana (APP_PASSWORD, env),
 * ei käyttäjätilejä. Portti on pois päältä jos APP_PASSWORD puuttuu — silloin
 * middleware päästää kaikki läpi (local-dev ja build ilman muuttujaa toimii
 * kuten ennen).
 */

export const AUTH_COOKIE = "co_auth";

/**
 * Deterministinen SHA-256-token salasanasta. Evästeeseen tallennetaan tämä
 * token, EI raakaa salasanaa. Web Crypto toimii sekä edge-middlewaressa että
 * Node-routessa.
 */
export async function passwordToToken(password: string): Promise<string> {
  const data = new TextEncoder().encode("content-os:" + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function gateEnabled(): boolean {
  const p = process.env.APP_PASSWORD;
  return typeof p === "string" && p.length > 0;
}
