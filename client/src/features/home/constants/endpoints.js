/**
 * Homepage API paths. The shared axios client already carries the `/api`
 * base URL, so every path here stays relative to it.
 */
export const HOME_ENDPOINTS = {
  advertised: "/medicines/advertised",
  categories: "/categories",
  discounted: "/medicines/discounted",
  featured: "/medicines/featured",
  healthTips: "/health-tips",
};

export const HOME_QUERY_PARAMS = {
  advertised: { limit: 4 },
  categories: { active: true },
  discounted: { limit: 8, sort: "-discountPercent" },
  featured: { limit: 8 },
  healthTips: { limit: 4 },
};
