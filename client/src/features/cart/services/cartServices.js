import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/constants/api";
import { clearLocalCart, getCartItems } from "@/features/shop/utils/cart";

function unwrap(data) {
  return data && typeof data === "object" && "data" in data ? data.data : data;
}

export async function fetchCart() {
  const { data } = await apiClient.get(API_ROUTES.cart.get);
  return unwrap(data).cart;
}

export async function addCartItem(medicineId, quantity = 1) {
  const { data } = await apiClient.post(API_ROUTES.cart.items, { medicineId, quantity });
  return unwrap(data).cart;
}

export async function updateCartItem(medicineId, quantity) {
  const { data } = await apiClient.patch(API_ROUTES.cart.item(medicineId), { quantity });
  return unwrap(data).cart;
}

export async function removeCartItem(medicineId) {
  const { data } = await apiClient.delete(API_ROUTES.cart.item(medicineId));
  return unwrap(data).cart;
}

export async function clearCartItems() {
  const { data } = await apiClient.delete(API_ROUTES.cart.clear);
  return unwrap(data).cart;
}

/** Pushes the persisted guest cart into the authenticated user's cart. */
export async function mergeGuestCart() {
  const items = getCartItems()
    .map((item) => ({ medicineId: item.id ?? item._id, quantity: Number(item.quantity) || 1 }))
    .filter((item) => item.medicineId);

  if (items.length === 0) return fetchCart();

  const { data } = await apiClient.post(API_ROUTES.cart.merge, { items });
  clearLocalCart();
  return unwrap(data).cart;
}
