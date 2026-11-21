export const PATHS = {
  HOME: "/",
  ABOUT: "/about",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  SHOP: "/shop",
  CATEGORIES: "/categories",
  CATEGORY_MEDICINES: "/categories/:categoryId",
  CATEGORY: (id) => `/categories/${encodeURIComponent(id)}`,
  DASHBOARD: "/dashboard",
  PROFILE: "/dashboard/profile",
  SELLER: "/dashboard/seller",
};
