import { API_ROUTES } from "@/constants/api";

/**
 * Homepage API paths. The shared axios client already carries the `/api`
 * base URL, so every path here stays relative to it.
 */
export const HOME_ENDPOINTS = Object.freeze({
  advertised: API_ROUTES.medicines.advertised,
  categories: API_ROUTES.categories.list,
  discounted: API_ROUTES.medicines.discounted,
  featured: API_ROUTES.medicines.featured,
  healthTips: API_ROUTES.healthTips,
});

export const HOME_QUERY_PARAMS = {
  advertised: { limit: 4 },
  categories: { active: true },
  discounted: { limit: 8, sort: "-discountPercent" },
  featured: { limit: 8 },
  healthTips: { limit: 4 },
};
