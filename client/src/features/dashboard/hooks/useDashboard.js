import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { dashboardKeys } from "../constants/queryKeys";
import * as service from "../services/dashboardServices";

const options = { retry: 1, staleTime: 30_000 };

export function useAccount() {
  return useQuery({ queryKey: dashboardKeys.me(), queryFn: service.fetchAccount, ...options });
}

export function useOrders(params = {}) {
  return useQuery({
    queryKey: dashboardKeys.orders(params),
    queryFn: () => service.fetchOrders(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: dashboardKeys.order(id),
    queryFn: () => service.fetchOrder(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function usePayments(params = {}) {
  return useQuery({
    queryKey: dashboardKeys.payments(params),
    queryFn: () => service.fetchPayments(params),
    ...options,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: service.cancelOrder,
    onSuccess: () => {
      notify.success("Order cancelled and stock restored.");
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onError: (error) => notify.error(error),
  });
}
