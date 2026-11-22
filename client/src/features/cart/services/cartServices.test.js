import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/features/shop/utils/cart", () => ({
  getCartItems: vi.fn(),
  clearLocalCart: vi.fn(),
}));

import { apiClient } from "@/lib/api";
import { clearLocalCart, getCartItems } from "@/features/shop/utils/cart";
import { addCartItem, fetchCart, mergeGuestCart, updateCartItem } from "./cartServices";

const cart = { id: "c1", items: [], itemCount: 1, subtotal: 10, discount: 0, total: 10 };

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.get.mockResolvedValue({ data: { success: true, data: { cart } } });
  apiClient.post.mockResolvedValue({ data: { success: true, data: { cart } } });
  apiClient.patch.mockResolvedValue({ data: { success: true, data: { cart } } });
});

describe("cart services", () => {
  it("fetches the authenticated user's cart", async () => {
    await expect(fetchCart()).resolves.toEqual(cart);
    expect(apiClient.get).toHaveBeenCalledWith("/cart");
  });

  it("adds an item using only a medicine id and quantity", async () => {
    await addCartItem("med-1", 2);

    expect(apiClient.post).toHaveBeenCalledWith("/cart/items", {
      medicineId: "med-1",
      quantity: 2,
    });
  });

  it("updates quantity without sending prices", async () => {
    await updateCartItem("med-1", 4);

    expect(apiClient.patch).toHaveBeenCalledWith("/cart/items/med-1", { quantity: 4 });
  });

  it("merges the local guest cart and clears it afterwards", async () => {
    getCartItems.mockReturnValue([
      { id: "med-1", quantity: 2, price: 15 },
      { id: "med-2", quantity: 1, price: 25 },
    ]);

    await mergeGuestCart();

    expect(apiClient.post).toHaveBeenCalledWith("/cart/merge", {
      items: [
        { medicineId: "med-1", quantity: 2 },
        { medicineId: "med-2", quantity: 1 },
      ],
    });
    expect(clearLocalCart).toHaveBeenCalledOnce();
  });
});
