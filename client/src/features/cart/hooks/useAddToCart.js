import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { notify } from "@/lib/notify";
import { PATHS } from "@/utils/paths";
import { useCart } from "./useCart";

/**
 * Storefront add-to-cart action. Browsing the catalog is public, but adding
 * items requires an account: guests are sent to login (with the current page
 * remembered) instead of silently writing to a local guest cart.
 *
 * Returns null when the action was blocked by the auth guard, so callers do
 * not show a misleading "added to cart" confirmation.
 */
export function useAddToCart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { add } = useCart();

  return useCallback(
    async (medicine, quantity = 1) => {
      if (!isAuthenticated) {
        notify.info("Sign in to add medicines to your cart.");
        navigate(PATHS.LOGIN, { state: { from: location } });
        return null;
      }

      return add(medicine, quantity);
    },
    [add, isAuthenticated, location, navigate],
  );
}
