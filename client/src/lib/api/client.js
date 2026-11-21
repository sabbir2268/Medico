import axios from "axios";
import { env } from "@/config/env";
import { normalizeApiError } from "./errors";

let accessTokenGetter = null;
let unauthorizedHandler = null;

/**
 * Lets the auth layer provide a token without coupling the API client to
 * Firebase, JWT storage, or any specific provider.
 */
export function setAccessTokenGetter(getter) {
  accessTokenGetter = typeof getter === "function" ? getter : null;
}

/**
 * Called once after a 401 so the auth layer can exchange a fresh Firebase ID
 * token for a new backend JWT and retry the request.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
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
  // An explicit Authorization header (for example during token exchange) wins.
  if (config.headers?.Authorization) {
    return config;
  }

  const token = await accessTokenGetter?.();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;

    if (
      isUnauthorized &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      unauthorizedHandler
    ) {
      originalRequest._retry = true;

      try {
        const token = await unauthorizedHandler();

        if (token) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${token}`;

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(normalizeApiError(refreshError));
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

export default apiClient;
