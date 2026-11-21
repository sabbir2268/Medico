/** Storefront endpoints used by the shop and category medicine pages. */
export const SHOP_ENDPOINTS = {
  medicines: "/medicines",
  medicine: (id) => `/medicines/${encodeURIComponent(id)}`,
};

/** URL query parameters. Keep them in sync with useCatalogParams. */
export const CATALOG_PARAMS = {
  search: "q",
  category: "category",
  sort: "sort",
  page: "page",
  limit: "limit",
};

export const SORT_OPTIONS = [
  { value: "", label: "Featured", apiValue: "" },
  { value: "price_asc", label: "Price: Low to High", apiValue: "price" },
  { value: "price_desc", label: "Price: High to Low", apiValue: "-price" },
];

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function sortToApiValue(value) {
  return SORT_OPTIONS.find((option) => option.value === value)?.apiValue ?? "";
}

export function normalizeSort(value) {
  return SORT_OPTIONS.some((option) => option.value === value) ? value : "";
}
