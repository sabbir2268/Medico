import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CATALOG_PARAMS,
  DEFAULT_PAGE_SIZE,
  normalizeSort,
  PAGE_SIZE_OPTIONS,
} from "../constants/endpoints";

function positiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

/**
 * Single source of truth for the catalog URL. Search, category, sort, page and
 * page size all live in the query string so views are shareable and back /
 * forward navigation restores the exact table state.
 */
export function useCatalogParams({ lockedCategoryId } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get(CATALOG_PARAMS.search) ?? "";
  const category = lockedCategoryId ?? searchParams.get(CATALOG_PARAMS.category) ?? "";
  const sort = normalizeSort(searchParams.get(CATALOG_PARAMS.sort));
  const page = positiveInteger(searchParams.get(CATALOG_PARAMS.page), 1);
  const limit = positiveInteger(
    searchParams.get(CATALOG_PARAMS.limit),
    DEFAULT_PAGE_SIZE,
  );
  const safeLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : DEFAULT_PAGE_SIZE;

  const update = useCallback(
    (patch, { resetPage = true } = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          Object.entries(patch).forEach(([key, value]) => {
            const empty = value === "" || value === null || value === undefined;

            if (empty) {
              next.delete(key);

              return;
            }

            next.set(key, String(value));
          });

          if (resetPage) next.delete(CATALOG_PARAMS.page);

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clear = useCallback(
    () => setSearchParams({}, { replace: true }),
    [setSearchParams],
  );

  return {
    search,
    category,
    sort,
    page,
    limit: safeLimit,
    update,
    clear,
    hasFilters: Boolean(search || category || sort),
  };
}
