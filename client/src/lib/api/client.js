import axios from "axios";
import { env } from "@/config/env";
import { normalizeApiError } from "./errors";

const AUTH_EXCHANGE_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/social",
  "/auth/refresh",
  "/auth/firebase",
];

let accessTokenGetter = null;
let tokenRefresher = null;
let refreshPromise = null;

/**
 * Lets the future auth layer provide a token without coupling the API client
 * to Firebase, JWT storage, or any specific provider.
 */
export function setAccessTokenGetter(getter) {
  accessTokenGetter = typeof getter === "function" ? getter : null;
}

export function setTokenRefresher(refresher) {
  tokenRefresher = typeof refresher === "function" ? refresher : null;
  refreshPromise = null;
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = Promise.resolve(tokenRefresher())
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: env.VITE_API_TIMEOUT,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  let token = null;

  try {
    token = await accessTokenGetter?.();
  } catch {
    /* A missing/expired session must not block public requests. */
  }

  if (token && !config._authRetried) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const isExchange = AUTH_EXCHANGE_ENDPOINTS.some((endpoint) =>
      String(config?.url ?? "").startsWith(endpoint),
    );

    if (
      status === 401 &&
      tokenRefresher &&
      config &&
      !config._authRetried &&
      !isExchange
    ) {
      config._authRetried = true;

      try {
        const token = await refreshAccessToken();

        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
          return apiClient(config);
        }
      } catch {
        return Promise.reject(normalizeApiError(error));
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);
