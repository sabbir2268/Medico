function base64UrlToBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;

  return padding === 0 ? normalized : `${normalized}${"=".repeat(4 - padding)}`;
}

/**
 * Decodes a JWT payload without verifying the signature. Verification is the
 * backend's job; this is only used to read expiry and non-sensitive claims.
 */
export function decodeJwtPayload(token) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const json = atob(base64UrlToBase64(parts[1]));
    const bytes = Uint8Array.from(json, (character) => character.charCodeAt(0));

    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function isTokenExpired(token, skewSeconds = 30) {
  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
