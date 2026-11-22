export const dashboardKeys = {
  all: ["dashboard"],
  me: () => [...dashboardKeys.all, "me"],
  orders: (params) => [...dashboardKeys.all, "orders", params ?? {}],
  order: (id) => [...dashboardKeys.all, "orders", id],
  payments: (params) => [...dashboardKeys.all, "payments", params ?? {}],
};
