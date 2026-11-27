import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { hasBackendSession } from "@/features/auth/utils/tokenStore";
import {
  addToCart as addLocal,
  CART_CHANGE_EVENT,
  clearLocalCart,
  getCartCount,
  getCartItems,
  removeLocalCartItem,
  updateLocalCartItem,
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
        visual: item.visual ?? "capsule",
        tone: item.tone ?? "teal",
        manufacturer: item.manufacturer ?? "",
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

/**
 * Storefront buttons add to the local cart so demo medicines (which are not in
 * the database) still work. When a backend session exists, keep those local
 * items visible alongside the server cart so nothing disappears on /cart.
 */
function withLocalItems(baseCart) {
  const local = readGuestCart();
  if (local.items.length === 0) return baseCart;

  const serverIds = new Set(baseCart.items.map((item) => item.medicineId ?? item.id));
  const extraItems = local.items.filter((item) => !serverIds.has(item.medicineId));
  if (extraItems.length === 0) return baseCart;

  const extraCount = extraItems.reduce((sum, item) => sum + item.quantity, 0);
  const extraTotal = extraItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    ...baseCart,
    items: [...baseCart.items, ...extraItems],
    itemCount: (baseCart.itemCount ?? 0) + extraCount,
    subtotal: (baseCart.subtotal ?? 0) + extraTotal,
    total: (baseCart.total ?? 0) + extraTotal,
  };
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
  const [localRevision, setLocalRevision] = useState(0);

  useEffect(() => {
    function handleLocalChange() {
      setLocalRevision((revision) => revision + 1);
    }

    window.addEventListener(CART_CHANGE_EVENT, handleLocalChange);
    return () => window.removeEventListener(CART_CHANGE_EVENT, handleLocalChange);
  }, []);

  const query = useQuery({
    queryKey: cartKeys.detail(),
    queryFn: cartService.fetchCart,
    enabled: useServerCart,
    retry: 1,
  });

  const cart = useMemo(() => {
    // localRevision is read so any local cart write recomputes this value.
    void localRevision;
    if (!useServerCart) return readGuestCart();
    return withLocalItems(query.data ?? EMPTY_CART);
  }, [useServerCart, query.data, localRevision]);

  // Adding is allowed to fail on the server (e.g. a demo medicine that is not
  // in the database); in that case the item stays in the local cart.
  const addMutation = useMutation({
    mutationFn: ({ medicineId, quantity }) => cartService.addCartItem(medicineId, quantity),
    onSuccess: (updatedCart) => queryClient.setQueryData(cartKeys.detail(), updatedCart),
  });

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
      if (!medicineId) return getCartCount();

      if (!useServerCart) return addLocal(medicine, quantity);

      try {
        const updatedCart = await addMutation.mutateAsync({ medicineId, quantity });
        // The server now owns this medicine, so drop any local copy of it.
        removeLocalCartItem(medicineId);
        return (updatedCart?.itemCount ?? 0) + getCartCount();
      } catch {
        // Demo / unknown medicines cannot be stored server-side yet.
        return addLocal(medicine, quantity);
      }
    },
    [addMutation, useServerCart],
  );

  const isLocalItem = useCallback(
    (medicineId) => getCartItems().some((item) => (item.id ?? item._id) === medicineId),
    [],
  );

  const update = useCallback(
    async (medicineId, quantity) => {
      if (isLocalItem(medicineId)) {
        if (quantity < 1) removeLocalCartItem(medicineId);
        else updateLocalCartItem(medicineId, quantity);
        return;
      }
      if (!useServerCart) return;
      if (quantity < 1) {
        await removeMutation.mutateAsync({ medicineId });
        return;
      }
      await updateMutation.mutateAsync({ medicineId, quantity });
    },
    [isLocalItem, useServerCart, removeMutation, updateMutation],
  );

  const remove = useCallback(
    async (medicineId) => {
      if (isLocalItem(medicineId)) {
        removeLocalCartItem(medicineId);
        return;
      }
      if (!useServerCart) return;
      await removeMutation.mutateAsync({ medicineId });
    },
    [isLocalItem, useServerCart, removeMutation],
  );

  const clear = useCallback(async () => {
    clearLocalCart();
    if (!useServerCart) return;
    await clearMutation.mutateAsync();
  }, [clearMutation, useServerCart]);

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
      addMutation.isPending ||
      updateMutation.isPending ||
      removeMutation.isPending ||
      clearMutation.isPending,
  };
}
