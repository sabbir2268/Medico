import { apiClient } from "@/lib/api";
import { env } from "@/config/env";
import { FALLBACK_MEDICINES } from "@/features/home/data/fallbackData";
import {
  DEFAULT_PAGE_SIZE,
  SHOP_ENDPOINTS,
  sortToApiValue,
} from "../constants/endpoints";

function unwrap(payload) {
  return payload && typeof payload === "object" && "data" in payload
    ? payload.data
    : payload;
}

function normalizeItems(body) {
  if (Array.isArray(body)) return body;

  for (const key of ["items", "results", "medicines"]) {
    if (Array.isArray(body?.[key])) return body[key];
  }

  return [];
}

function toPositive(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function toNonNegative(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function normalizePagination(body, requested) {
  const raw = body?.pagination ?? body?.meta?.pagination ?? {};
  const page = toPositive(raw.page ?? requested.page, requested.page);
  const limit = toPositive(raw.limit ?? requested.limit, requested.limit);
  const total = toNonNegative(
    raw.total ?? body?.total ?? requested.total,
    requested.total,
  );
  const totalPages = toPositive(raw.totalPages ?? Math.ceil(total / limit), 1);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: raw.hasNext ?? page < totalPages,
    hasPrev: raw.hasPrev ?? page > 1,
  };
}

function matchesCategory(medicine, category) {
  if (!category) return true;

  const value = String(category).toLowerCase();
  const own =
    medicine.categoryId ?? medicine.category?.id ?? medicine.category?._id ?? "";
  const ownName =
    medicine.category?.name ?? medicine.categoryName ?? medicine.category ?? "";

  return String(own).toLowerCase() === value || String(ownName).toLowerCase() === value;
}

function matchesSearch(medicine, search) {
  if (!search) return true;

  const needle = search.trim().toLowerCase();

  return [medicine.name, medicine.genericName, medicine.manufacturer, medicine.company]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(needle));
}

/** Emulates server-side filtering/sorting/pagination for the demo catalog. */
function getFallbackMedicines({ search, category, sort, page, limit }) {
  const filtered = FALLBACK_MEDICINES.filter(
    (medicine) => matchesCategory(medicine, category) && matchesSearch(medicine, search),
  );

  if (sort === "price_asc") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price_desc") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
    isFallback: true,
  };
}

/**
 * GET /medicines — the catalog is always fetched through TanStack Query, which
 * calls this service. The shared axios client supplies the /api base URL and
 * attaches the Firebase ID token when available.
 */
export async function getMedicines({
  search = "",
  category = "",
  sort = "",
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  minPrice,
  maxPrice,
} = {}) {
  const requestParams = {
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(sort ? { sort: sortToApiValue(sort) } : {}),
    ...(minPrice !== undefined && minPrice !== "" ? { minPrice } : {}),
    ...(maxPrice !== undefined && maxPrice !== "" ? { maxPrice } : {}),
    page,
    limit,
  };

  try {
    const { data } = await apiClient.get(SHOP_ENDPOINTS.medicines, {
      params: requestParams,
    });
    const body = unwrap(data);

    return {
      items: normalizeItems(body),
      pagination: normalizePagination(body, { page, limit, total: 0 }),
      isFallback: false,
    };
  } catch (error) {
    if (!env.VITE_USE_FALLBACK_DATA) throw error;

    return getFallbackMedicines({ search, category, sort, page, limit });
  }
}
