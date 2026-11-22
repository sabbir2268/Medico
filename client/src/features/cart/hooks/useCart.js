import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { hasBackendSession } from "@/features/auth/utils/tokenStore";
import {
  addToCart as addLocal,
  getCartCount,
  getCartItems,
  clearLocalCart,
} from "@/features/shop/utils/cart";
import { notify } from "@/lib/notify";
import { cartKeys } from "../constants/queryKeys";
import * as cartService from "../services/cartServices";

const EMPTY_CART = {
  id: null,
  items: [],
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  deliveryCharge: 0,
  total: 0,
};

function readGuestCart() {
  const items = getCartItems().map((item) => {
    const unitPrice = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;

    return {
      medicineId: item.id ?? item._id,
      medicine: {
        id: item.id ?? item._id,
        name: item.name ?? "Medicine",
        image: item.image ?? "",
        price: unitPrice,
        originalPrice: unitPrice,
        vendor: "Local cart",
        inStock: true,
      },
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      availableStock: 99,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return { ...EMPTY_CART, items, itemCount: getCartCount(), subtotal, total: subtotal, isGuest: true };
}

function useCartMutation(mutationFn, optimisticUpdate) {
  const queryClient = useQueryClient();
  const key = cartKeys.detail();

  return useMutation({
    mutationFn,
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      if (previous && optimisticUpdate) {
        queryClient.setQueryData(key, optimisticUpdate(previous, args));
      }
      return { previous };
    },
    onError: (error, _args, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      notify.error(error);
    },
    onSuccess: (cart) => queryClient.setQueryData(key, cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  // Firebase-only sessions have no backend JWT, so keep using the local cart.
  const useServerCart = isAuthenticated && hasBackendSession();

  const query = useQuery({
    queryKey: cartKeys.detail(),
    queryFn: cartService.fetchCart,
    enabled: useServerCart,
    retry: 1,
  });

  const cart = useMemo(
    () => (useServerCart ? query.data ?? EMPTY_CART : readGuestCart()),
    [useServerCart, query.data],
  );

  const addMutation = useCartMutation(
    ({ medicineId, quantity }) => cartService.addCartItem(medicineId, quantity),
    (current) => ({
      ...current,
      itemCount: current.itemCount + 1,
    }),
  );
  const updateMutation = useCartMutation(
    ({ medicineId, quantity }) => cartService.updateCartItem(medicineId, quantity),
    (current, { medicineId, quantity }) => ({
      ...current,
      items: current.items.map((item) =>
        item.medicineId === medicineId ? { ...item, quantity } : item,
      ),
      itemCount: current.items.reduce(
        (sum, item) => sum + (item.medicineId === medicineId ? quantity : item.quantity),
        0,
      ),
    }),
  );
  const removeMutation = useCartMutation(
    ({ medicineId }) => cartService.removeCartItem(medicineId),
    (current, { medicineId }) => {
      const items = current.items.filter((item) => item.medicineId !== medicineId);
      return {
        ...current,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    },
  );
  const clearMutation = useCartMutation(() => cartService.clearCartItems(), () => EMPTY_CART);

  const add = useCallback(
    async (medicine, quantity = 1) => {
      const medicineId = medicine?.medicineId ?? medicine?.id ?? medicine?._id;
      if (!medicineId) return;

      if (!useServerCart) {
        addLocal(medicine);
        queryClient.setQueryData(cartKeys.detail(), readGuestCart());
        return;
      }

      await addMutation.mutateAsync({ medicineId, quantity });
    },
    [addMutation, useServerCart, queryClient],
  );

  const update = useCallback(
    async (medicineId, quantity) => {
      if (!useServerCart) return;
      if (quantity < 1) {
        await removeMutation.mutateAsync({ medicineId });
        return;
      }
      await updateMutation.mutateAsync({ medicineId, quantity });
    },
    [useServerCart, removeMutation, updateMutation],
  );

  const remove = useCallback(
    async (medicineId) => {
      if (!useServerCart) return;
      await removeMutation.mutateAsync({ medicineId });
    },
    [useServerCart, removeMutation],
  );

  const clear = useCallback(async () => {
    if (!useServerCart) {
      clearLocalCart();
      queryClient.setQueryData(cartKeys.detail(), readGuestCart());
      return;
    }
    await clearMutation.mutateAsync();
  }, [clearMutation, useServerCart, queryClient]);

  const syncGuestCart = useCallback(async () => {
    if (!useServerCart) return;
    const merged = await cartService.mergeGuestCart();
    queryClient.setQueryData(cartKeys.detail(), merged);
  }, [useServerCart, queryClient]);

  return {
    cart,
    query,
    isPending: useServerCart && query.isPending,
    isError: useServerCart && query.isError,
    isGuest: !useServerCart,
    add,
    update,
    remove,
    clear,
    syncGuestCart,
    isMutating:
      addMutation.isPending || updateMutation.isPending || removeMutation.isPending || clearMutation.isPending,
  };
}
