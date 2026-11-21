import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE } from "../constants/endpoints";
import { shopKeys } from "../constants/queryKeys";
import { getMedicines } from "../services/shopServices";

export const EMPTY_PAGINATION = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

export function useMedicines({
  search = "",
  category = "",
  sort = "",
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
} = {}) {
  const query = useQuery({
    queryKey: shopKeys.medicines({ search, category, sort, page, limit }),
    queryFn: () => getMedicines({ search, category, sort, page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 0,
  });
  const items = query.data?.items ?? [];

  return {
    ...query,
    items,
    pagination: query.data?.pagination ?? EMPTY_PAGINATION,
    isFallback: Boolean(query.data?.isFallback),
    isEmpty: !query.isPending && !query.isError && items.length === 0,
  };
}
