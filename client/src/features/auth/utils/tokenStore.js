/**
 * Backend JWT storage. Firebase tokens remain handled by the Firebase SDK;
 * only tokens issued by our own API live here.
 */
const ACCESS_KEY = "medico.auth.accessToken";
const REFRESH_KEY = "medico.auth.refreshToken";

function read(key) {
  try {
    return localStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}

export const getAccessToken = () => read(ACCESS_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);
export const hasBackendSession = () => Boolean(getAccessToken() || getRefreshToken());

export function storeTokens(payload) {
  if (!payload) return;
  write(ACCESS_KEY, payload.accessToken ?? null);
  write(REFRESH_KEY, payload.refreshToken ?? null);
}

export function clearTokens() {
  write(ACCESS_KEY, null);
  write(REFRESH_KEY, null);
}
