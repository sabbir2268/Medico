import { useQuery } from "@tanstack/react-query";
import {
  fallbackCategories,
  fallbackDiscountedMedicines,
  fallbackFeaturedMedicines,
  fallbackHealthcareTips,
  fallbackHeroSlides,
} from "../data/fallbackHomeData";
import {
  getCategories,
  getDiscountedMedicines,
  getFeaturedMedicines,
  getHealthcareTips,
  getHeroSlides,
} from "../services/homeService";

const queryOptions = {
  staleTime: 5 * 60_000,
  retry: 1,
};

export function useHomepageData() {
  const hero = useQuery({
    queryKey: ["home", "hero"],
    queryFn: getHeroSlides,
    ...queryOptions,
  });

  const categories = useQuery({
    queryKey: ["home", "categories"],
    queryFn: getCategories,
    ...queryOptions,
  });

  const discounted = useQuery({
    queryKey: ["home", "discounted-medicines"],
    queryFn: getDiscountedMedicines,
    ...queryOptions,
  });

  const featured = useQuery({
    queryKey: ["home", "featured-medicines"],
    queryFn: getFeaturedMedicines,
    ...queryOptions,
  });

  const tips = useQuery({
    queryKey: ["home", "healthcare-tips"],
    queryFn: getHealthcareTips,
    ...queryOptions,
  });

  return {
    hero: {
      ...hero,
      items: hero.isError ? fallbackHeroSlides : (hero.data ?? []),
    },
    categories: {
      ...categories,
      items: categories.isError ? fallbackCategories : (categories.data ?? []),
    },
    discounted: {
      ...discounted,
      items: discounted.isError
        ? fallbackDiscountedMedicines
        : (discounted.data ?? []),
    },
    featured: {
      ...featured,
      items: featured.isError ? fallbackFeaturedMedicines : (featured.data ?? []),
    },
    tips: {
      ...tips,
      items: tips.isError ? fallbackHealthcareTips : (tips.data ?? []),
    },
  };
}
