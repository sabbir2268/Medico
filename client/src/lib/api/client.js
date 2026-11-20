import axios from "axios";
import { env } from "@/config/env";
import { normalizeApiError } from "./errors";

let accessTokenGetter = null;

/**
 * Lets the future auth layer provide a token without coupling the API client
 * to Firebase, JWT storage, or any specific provider.
 */
export function setAccessTokenGetter(getter) {
  accessTokenGetter = typeof getter === "function" ? getter : null;
}

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: env.VITE_API_TIMEOUT,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = accessTokenGetter?.();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);

export default apiClient;
