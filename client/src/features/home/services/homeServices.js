import { apiClient } from "@/lib/api";
import { env } from "@/config/env";
import { HOME_ENDPOINTS, HOME_QUERY_PARAMS } from "../constants/endpoints";
import {
  FALLBACK_ADVERTISED,
  FALLBACK_CATEGORIES,
  FALLBACK_DISCOUNTED,
  FALLBACK_FEATURED,
  FALLBACK_HEALTH_TIPS,
} from "../data/fallbackData";

/**
 * Storefront endpoints reply with the shared `{ success, data }` envelope,
 * but plain arrays and `{ items }` payloads are accepted too so the UI keeps
 * working with either contract.
 */
function unwrapCollection(payload) {
  const body =
    payload && typeof payload === "object" && "data" in payload ? payload.data : payload;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.results)) return body.results;

  return [];
}

async function getCollection({ endpoint, params, fallback }) {
  try {
    const response = await apiClient.get(endpoint, params ? { params } : undefined);
    return { items: unwrapCollection(response.data), isFallback: false };
  } catch (error) {
    if (!env.VITE_USE_FALLBACK_DATA) {
      throw error;
    }

    return { items: fallback, isFallback: true };
  }
}

export function getAdvertisedMedicines() {
  return getCollection({
    endpoint: HOME_ENDPOINTS.advertised,
    params: HOME_QUERY_PARAMS.advertised,
    fallback: FALLBACK_ADVERTISED,
  });
}

export function getCategories() {
  return getCollection({
    endpoint: HOME_ENDPOINTS.categories,
    params: HOME_QUERY_PARAMS.categories,
    fallback: FALLBACK_CATEGORIES,
  });
}

export function getDiscountedMedicines() {
  return getCollection({
    endpoint: HOME_ENDPOINTS.discounted,
    params: HOME_QUERY_PARAMS.discounted,
    fallback: FALLBACK_DISCOUNTED,
  });
}

export function getFeaturedMedicines() {
  return getCollection({
    endpoint: HOME_ENDPOINTS.featured,
    params: HOME_QUERY_PARAMS.featured,
    fallback: FALLBACK_FEATURED,
  });
}

export function getHealthTips() {
  return getCollection({
    endpoint: HOME_ENDPOINTS.healthTips,
    params: HOME_QUERY_PARAMS.healthTips,
    fallback: FALLBACK_HEALTH_TIPS,
  });
}
