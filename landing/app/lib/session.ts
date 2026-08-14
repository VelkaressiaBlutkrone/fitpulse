export const WAITLIST_SESSION_COOKIE = "fitpulse_waitlist_session";
export const VISITOR_SESSION_COOKIE = "fitpulse_visitor";

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export function createSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

export async function hashSessionToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return encodeBase64Url(new Uint8Array(digest));
}

export function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return part.slice(separator + 1).trim();
  }
  return null;
}

function secureAttribute(requestUrl: string) {
  return new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
}

export function sessionCookie(name: string, token: string, requestUrl: string) {
  return `${name}=${token}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict${secureAttribute(requestUrl)}`;
}

export function clearSessionCookie(name: string, requestUrl: string) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secureAttribute(requestUrl)}`;
}
