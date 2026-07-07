/**
 * Vaihe 19: auth-ydin. Ei ulkoisia kirjastoja — kaikki Web Cryptoa jotta
 * `verifySession` toimii sekä node- että edge-runtimessa (middleware kutsuu).
 * `hashPassword`/`verifyPassword` käyttävät PBKDF2:ta joka toimii nodessa;
 * middleware ei koskaan kutsu niitä.
 */

export const SESSION_COOKIE = "co_session";
const enc = new TextEncoder();

/* ============ Salasanan hash (PBKDF2-SHA256) ============ */

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100_000;
  const bits = await pbkdf2(password, salt, iterations);
  return `pbkdf2$${iterations}$${toHex(salt)}$${toHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const [scheme, iterStr, saltHex, hashHex] = parts;
  if (scheme !== "pbkdf2") return false;
  const iterations = parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const salt = fromHex(saltHex);
  const bits = await pbkdf2(password, salt, iterations);
  return timingSafeEqualHex(toHex(new Uint8Array(bits)), hashHex);
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      // Kopio jotta tyyppi on ArrayBuffer eikä ArrayBufferLike
      salt: salt.slice().buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );
}

/* ============ Istunto (HMAC-SHA256, edge-yhteensopiva) ============ */

export interface SessionPayload {
  uid: string;
  oid: string;
  role: string;
  exp: number; // ms epoch
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET puuttuu");
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function signSession(p: SessionPayload): Promise<string> {
  const body = b64urlEncode(enc.encode(JSON.stringify(p)));
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    enc.encode(body),
  );
  const sig = b64urlEncode(new Uint8Array(sigBuf));
  return `${body}.${sig}`;
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  let expectedBuf: ArrayBuffer;
  try {
    expectedBuf = await crypto.subtle.sign(
      "HMAC",
      await hmacKey(),
      enc.encode(body),
    );
  } catch {
    return null;
  }
  const expected = b64urlEncode(new Uint8Array(expectedBuf));
  if (!timingSafeEqualStr(expected, sig)) return null;
  try {
    const json = new TextDecoder().decode(b64urlDecode(body));
    const p = JSON.parse(json) as SessionPayload;
    if (
      typeof p.uid !== "string" ||
      typeof p.oid !== "string" ||
      typeof p.role !== "string" ||
      typeof p.exp !== "number" ||
      p.exp < Date.now()
    ) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

/**
 * Auth on päällä vain kun SESSION_SECRET on asetettu ja mock-tila ei ole päällä.
 * Muuten sovellus on demo-tilassa (getTenantContext antaa demo-adminin, middleware
 * päästää läpi). DB-tarkistus (`db.isEnabled`) tehdään data-kerroksessa ajoituksen
 * takia; auth-mode-lippu käyttää vain env-tarkistuksia jotta se on synkroninen.
 */
export function authEnabled(): boolean {
  const hasSecret =
    typeof process.env.SESSION_SECRET === "string" &&
    process.env.SESSION_SECRET.length > 0;
  const mock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  return hasSecret && !mock;
}

/* ============ Apurit ============ */

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : "0" + hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa on saatavilla sekä edgessä että nodessa (>=16)
  const b64 = typeof btoa === "function" ? btoa(bin) : bufferToBase64(bytes);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const b64 =
    str.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (str.length % 4)) % 4);
  const bin =
    typeof atob === "function" ? atob(b64) : base64ToBuffer(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bufferToBase64(bytes: Uint8Array): string {
  // Node-fallback jos btoa puuttuu (vanhat runtimet).
  const g = globalThis as unknown as {
    Buffer?: { from: (b: Uint8Array) => { toString: (enc: string) => string } };
  };
  return g.Buffer
    ? g.Buffer.from(bytes).toString("base64")
    : "";
}

function base64ToBuffer(b64: string): string {
  const g = globalThis as unknown as {
    Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } };
  };
  return g.Buffer ? g.Buffer.from(b64, "base64").toString("binary") : "";
}

function timingSafeEqualHex(a: string, b: string): boolean {
  return timingSafeEqualStr(a, b);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
