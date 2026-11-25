import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { adminKeys } from "../constants/queryKeys";
import * as api from "../services/adminServices";

const options = { retry: 1, staleTime: 30_000 };

function useList(key, fetcher, params) {
  return useQuery({
    queryKey: key(params),
    queryFn: () => fetcher(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export const useAdminDashboard = () =>
  useQuery({ queryKey: adminKeys.dashboard(), queryFn: api.fetchDashboard, ...options });

export const useAdminAnalytics = (params) =>
  useQuery({ queryKey: adminKeys.analytics(params), queryFn: () => api.fetchAnalytics(params), ...options });

export const useAdminUsers = (params) => useList(adminKeys.users, api.fetchUsers, params);
export const useAdminSellers = (params) => useList(adminKeys.sellers, api.fetchSellers, params);
export const useAdminCategories = (params) => useList(adminKeys.categories, api.fetchCategories, params);
export const useAdminMedicines = (params) => useList(adminKeys.medicines, api.fetchMedicines, params);
export const useAdminOrders = (params) => useList(adminKeys.orders, api.fetchOrders, params);
export const useAdminPayments = (params) => useList(adminKeys.payments, api.fetchPayments, params);
export const useAdminAuditLogs = (params) => useList(adminKeys.auditLogs, api.fetchAuditLogs, params);
export const useAdminHealthTips = (params) =>
  useList(adminKeys.healthTips, api.fetchHealthTips, params);

export const useAdminAdvertisements = (params) =>
  useQuery({
    queryKey: adminKeys.advertisements(params),
    queryFn: () => api.fetchAdvertisements(params),
    ...options,
  });

export const useSalesReport = (params) =>
  useQuery({
    queryKey: adminKeys.report(params),
    queryFn: () => api.fetchSalesReport(params),
    enabled: Boolean(params.from || params.to),
    ...options,
  });

function useAction(mutationFn, message) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      notify.success(message);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (error) => notify.error(error),
  });
}

export const useUpdateUserRole = () => useAction(({ id, role }) => api.updateUserRole(id, role), "Role updated.");
export const useUpdateUserStatus = () =>
  useAction(({ id, isActive }) => api.updateUserStatus(id, isActive), "User status updated.");
export const useDeleteUser = () => useAction((id) => api.deleteUser(id), "User removed.");
export const useUpdateSellerStatus = () =>
  useAction(({ id, status, reason }) => api.updateSellerStatus(id, status, reason), "Seller status updated.");
export const useCreateCategory = () => useAction(api.createCategory, "Category created.");
export const useUpdateCategory = () =>
  useAction(({ id, values }) => api.updateCategory(id, values), "Category updated.");
export const useDeleteCategory = () => useAction((id) => api.deleteCategory(id), "Category deleted.");
export const useUpdateMedicineStatus = () =>
  useAction(({ id, status }) => api.updateMedicineStatus(id, status), "Medicine status updated.");
export const useUpdateAdStatus = () =>
  useAction(({ id, status, reason }) => api.updateAdvertisementStatus(id, status, reason), "Advertisement reviewed.");
export const useCreateHealthTip = () => useAction(api.createHealthTip, "Health tip created.");
export const useUpdateHealthTip = () =>
  useAction(({ id, values }) => api.updateHealthTip(id, values), "Health tip updated.");
export const useDeleteHealthTip = () => useAction((id) => api.deleteHealthTip(id), "Health tip deleted.");
