import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/constants/api";

function unwrap(data) {
  return data && typeof data === "object" && "data" in data ? data.data : data;
}

export async function fetchAccount() {
  const { data } = await apiClient.get(API_ROUTES.users.me);
  return unwrap(data).user;
}

export async function fetchOrders(params = {}) {
  const { data } = await apiClient.get(API_ROUTES.users.orders, { params });
  const body = unwrap(data);

  return {
    items: body.items ?? [],
    pagination: body.pagination ?? {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export async function fetchOrder(id) {
  const { data } = await apiClient.get(API_ROUTES.users.order(id));
  return unwrap(data).order;
}

export async function fetchPayments(params = {}) {
  const { data } = await apiClient.get(API_ROUTES.users.payments, { params });
  const body = unwrap(data);
  return { items: body.items ?? [], pagination: body.pagination ?? null };
}

export async function cancelOrder(id) {
  const { data } = await apiClient.post(API_ROUTES.users.cancelOrder(id));
  return unwrap(data).order;
}
