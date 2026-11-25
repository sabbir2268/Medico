export const homeKeys = {
  all: ["home"],
  advertised: () => [...homeKeys.all, "advertised"],
  categories: () => [...homeKeys.all, "categories"],
  discounted: () => [...homeKeys.all, "discounted"],
  featured: () => [...homeKeys.all, "featured"],
  healthTips: () => [...homeKeys.all, "health-tips"],
};
