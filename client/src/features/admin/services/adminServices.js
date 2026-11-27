import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/constants/api";

function unwrap(data) {
  return data && typeof data === "object" && "data" in data ? data.data : data;
}

function list(payload) {
  const body = unwrap(payload);
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

export async function fetchDashboard() {
  const { data } = await apiClient.get(API_ROUTES.admin.dashboard);
  return unwrap(data);
}

export async function fetchAnalytics(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.analytics, { params });
  return unwrap(data);
}

export async function fetchUsers(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.users, { params });
  return list(data);
}

export async function updateUserRole(id, role) {
  const { data } = await apiClient.patch(API_ROUTES.admin.userRole(id), { role });
  return unwrap(data).user;
}

export async function updateUserStatus(id, isActive) {
  const { data } = await apiClient.patch(API_ROUTES.admin.userStatus(id), { isActive });
  return unwrap(data).user;
}

export async function deleteUser(id) {
  const { data } = await apiClient.delete(API_ROUTES.admin.user(id));
  return unwrap(data);
}

export async function fetchSellers(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.sellers, { params });
  return list(data);
}

export async function updateSellerStatus(id, sellerStatus, reason = "") {
  const { data } = await apiClient.patch(API_ROUTES.admin.sellerStatus(id), {
    sellerStatus,
    reason,
  });
  return unwrap(data).seller;
}

export async function fetchCategories(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.categories, { params });
  return list(data);
}

export async function createCategory(values) {
  const { data } = await apiClient.post(API_ROUTES.admin.categories, values);
  return unwrap(data).category;
}

export async function updateCategory(id, values) {
  const { data } = await apiClient.patch(API_ROUTES.admin.category(id), values);
  return unwrap(data).category;
}

export async function deleteCategory(id) {
  const { data } = await apiClient.delete(API_ROUTES.admin.category(id));
  return unwrap(data);
}

export async function fetchMedicines(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.medicines, { params });
  return list(data);
}

export async function updateMedicineStatus(id, status, reason = "") {
  const { data } = await apiClient.patch(API_ROUTES.admin.medicineStatus(id), { status, reason });
  return unwrap(data).medicine;
}

export async function fetchOrders(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.orders, { params });
  return list(data);
}

export async function fetchPayments(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.payments, { params });
  return list(data);
}

export async function fetchSalesReport(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.salesReport, { params });
  return unwrap(data);
}

export async function downloadSalesReport(format, params) {
  const response = await apiClient.get(API_ROUTES.admin.salesReport, {
    params: { ...params, format },
    responseType: "blob",
  });
  const type = format === "pdf" ? "application/pdf" : "text/csv";
  const url = window.URL.createObjectURL(new Blob([response.data], { type }));
  const link = document.createElement("a");

  link.href = url;
  link.download = `medico-sales-report.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchAdvertisements() {
  const { data } = await apiClient.get(API_ROUTES.admin.advertisements);
  return unwrap(data).items ?? [];
}

export async function updateAdvertisementStatus(id, status, reason = "") {
  const { data } = await apiClient.patch(API_ROUTES.admin.advertisementStatus(id), {
    status,
    reason,
  });
  return unwrap(data).advertisement;
}

export async function fetchHealthTips(params = {}) {
  const { data } = await apiClient.get(API_ROUTES.admin.healthTipList, { params });
  return list(data);
}

export async function createHealthTip(values) {
  const { data } = await apiClient.post(API_ROUTES.admin.healthTips, values);
  return unwrap(data).healthTip;
}

export async function updateHealthTip(id, values) {
  const { data } = await apiClient.patch(API_ROUTES.admin.healthTip(id), values);
  return unwrap(data).healthTip;
}

export async function deleteHealthTip(id) {
  const { data } = await apiClient.delete(API_ROUTES.admin.healthTip(id));
  return unwrap(data);
}

export async function fetchAuditLogs(params) {
  const { data } = await apiClient.get(API_ROUTES.admin.auditLogs, { params });
  return list(data);
}
