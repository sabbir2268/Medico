import { useQuery } from "@tanstack/react-query";
import { homeKeys } from "../constants/queryKeys";
import {
  getAdvertisedMedicines,
  getCategories,
  getDiscountedMedicines,
  getFeaturedMedicines,
  getHealthTips,
} from "../services/homeServices";

const queryOptions = {
  retry: 0,
  staleTime: 5 * 60_000,
};

function useHomeCollection(queryKey, queryFn) {
  const query = useQuery({ queryKey, queryFn, ...queryOptions });
  const items = query.data?.items ?? [];

  return {
    ...query,
    items,
    isFallback: Boolean(query.data?.isFallback),
    isEmpty: !query.isPending && !query.isError && items.length === 0,
  };
}

export function useAdvertisedMedicines() {
  return useHomeCollection(homeKeys.advertised(), getAdvertisedMedicines);
}

export function useCategories() {
  return useHomeCollection(homeKeys.categories(), getCategories);
}

export function useDiscountedMedicines() {
  return useHomeCollection(homeKeys.discounted(), getDiscountedMedicines);
}

export function useFeaturedMedicines() {
  return useHomeCollection(homeKeys.featured(), getFeaturedMedicines);
}

export function useHealthTips() {
  return useHomeCollection(homeKeys.healthTips(), getHealthTips);
}
