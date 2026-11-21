import { apiClient } from "@/lib/api";

export const HOME_ENDPOINTS = {
  hero: "/advertisements",
  categories: "/categories",
  discounted: "/medicines",
  featured: "/medicines",
  tips: "/health-tips",
};

const CATEGORY_TONES = [
  "teal",
  "sky",
  "amber",
  "emerald",
  "rose",
  "violet",
  "teal",
  "amber",
];

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function unwrapCollection(payload, keys) {
  const body = payload?.data ?? payload;

  if (Array.isArray(body)) {
    return body;
  }

  for (const key of [...keys, "results", "items", "data"]) {
    if (Array.isArray(body?.[key])) {
      return body[key];
    }
  }

  return [];
}

function firstImage(source) {
  if (!source || typeof source !== "object") return "";

  if (typeof source.image === "string") return source.image;
  if (typeof source.imageURL === "string") return source.imageURL;
  if (typeof source.thumbnail === "string") return source.thumbnail;
  if (typeof source.bannerImage === "string") return source.bannerImage;

  if (Array.isArray(source.images) && source.images.length > 0) {
    const first = source.images[0];
    return typeof first === "string" ? first : first?.url ?? "";
  }

  return "";
}

function categoryName(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.name ?? value.title ?? "";
  return "";
}

function normalizeHeroSlide(item) {
  const medicine =
    item?.medicine && typeof item.medicine === "object" ? item.medicine : null;
  const source = medicine ?? item ?? {};
  const slug = source.slug ?? source._id ?? source.id;

  return {
    id: item?._id ?? item?.id ?? source._id ?? source.id ?? slug,
    badge: item?.badge ?? item?.eyebrow ?? categoryName(source.category) ?? "Featured",
    title: item?.title ?? item?.headline ?? source.name ?? "",
    description:
      item?.description ?? item?.subtitle ?? item?.summary ?? source.shortDescription ?? "",
    ctaLabel: item?.ctaLabel ?? item?.buttonLabel ?? "Shop now",
    ctaHref: item?.ctaHref ?? item?.link ?? (slug ? `/shop?medicine=${slug}` : "/shop"),
    secondaryLabel: item?.secondaryLabel ?? "Browse categories",
    secondaryHref: item?.secondaryHref ?? "#categories",
    image: firstImage(item) || firstImage(source),
    imageAlt: item?.imageAlt ?? item?.title ?? source.name ?? "Featured medicine",
    note:
      item?.note ??
      item?.disclaimer ??
      "Every order is reviewed by a licensed pharmacist.",
  };
}

function normalizeCategory(item, index) {
  const slug = item?.slug ?? item?._id ?? item?.id ?? `category-${index + 1}`;

  return {
    id: item?._id ?? item?.id ?? slug,
    name: item?.name ?? item?.title ?? "Health category",
    slug,
    description: item?.description ?? item?.summary ?? "",
    icon: item?.icon ?? "Pill",
    tone: item?.tone ?? CATEGORY_TONES[index % CATEGORY_TONES.length],
    productCount: toNumber(
      item?.productCount ?? item?.productsCount ?? item?.count ?? item?.medicineCount,
    ),
  };
}

function normalizeMedicine(item) {
  const slug = item?.slug ?? item?._id ?? item?.id;
  const price = toNumber(item?.price ?? item?.discountPrice ?? item?.salePrice);
  const originalPrice = toNumber(
    item?.originalPrice ?? item?.compareAtPrice ?? item?.mrp ?? item?.price,
  );
  const explicitDiscount = toNumber(item?.discountPercent ?? item?.discount);
  const calculatedDiscount =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return {
    id: item?._id ?? item?.id ?? slug,
    name: item?.name ?? item?.title ?? "Medicine",
    slug,
    brand: item?.brand ?? item?.manufacturer ?? "Generic",
    category: categoryName(item?.category) || "Healthcare",
    price,
    originalPrice: originalPrice || price,
    discountPercent: explicitDiscount || calculatedDiscount,
    image: firstImage(item),
    vendor:
      item?.vendor?.name ??
      item?.vendorName ??
      item?.seller?.name ??
      item?.sellerName ??
      "Verified vendor",
    rating: toNumber(item?.rating ?? item?.averageRating),
    reviewCount: toNumber(item?.reviewCount ?? item?.numReviews ?? item?.reviews),
    prescriptionRequired: Boolean(
      item?.prescriptionRequired ?? item?.requiresPrescription ?? item?.rx,
    ),
    stock: toNumber(item?.stock ?? item?.quantity ?? item?.inventory),
  };
}

function normalizeTip(item) {
  const slug = item?.slug ?? item?._id ?? item?.id;

  return {
    id: item?._id ?? item?.id ?? slug,
    title: item?.title ?? "Healthcare advice",
    excerpt: item?.excerpt ?? item?.summary ?? item?.description ?? "",
    category: categoryName(item?.category) || item?.topic || "Wellness",
    readTime: item?.readTime ?? item?.readingTime ?? "4 min read",
    icon: item?.icon ?? "Leaf",
    image: firstImage(item),
    imageAlt: item?.imageAlt ?? item?.title ?? "Healthcare article",
    href: item?.href ?? (slug ? `/about?article=${slug}` : "/about"),
  };
}

export async function getHeroSlides() {
  const { data } = await apiClient.get(HOME_ENDPOINTS.hero, {
    params: { placement: "home-hero", active: true, limit: 6 },
  });

  return unwrapCollection(data, ["advertisements", "banners", "slides"])
    .map(normalizeHeroSlide)
    .filter((slide) => slide.title);
}

export async function getCategories() {
  const { data } = await apiClient.get(HOME_ENDPOINTS.categories, {
    params: { featured: true, limit: 8 },
  });

  return unwrapCollection(data, ["categories"]).map(normalizeCategory);
}

export async function getDiscountedMedicines() {
  const { data } = await apiClient.get(HOME_ENDPOINTS.discounted, {
    params: { discounted: true, limit: 10, sort: "-discountPercent" },
  });

  return unwrapCollection(data, ["medicines", "products"])
    .map(normalizeMedicine)
    .filter((medicine) => medicine.discountPercent > 0);
}

export async function getFeaturedMedicines() {
  const { data } = await apiClient.get(HOME_ENDPOINTS.featured, {
    params: { featured: true, limit: 8 },
  });

  return unwrapCollection(data, ["medicines", "products"]).map(normalizeMedicine);
}

export async function getHealthcareTips() {
  const { data } = await apiClient.get(HOME_ENDPOINTS.tips, {
    params: { limit: 3 },
  });

  return unwrapCollection(data, ["tips", "articles", "posts"]).map(normalizeTip);
}
