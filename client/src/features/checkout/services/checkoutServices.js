import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/constants/api";

const IDEMPOTENCY_KEY = "medico.checkout.idempotencyKey";

function unwrap(data) {
  return data && typeof data === "object" && "data" in data ? data.data : data;
}

function newKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Stable per-browser key so a retried submit cannot create duplicate orders. */
export function getCheckoutIdempotencyKey() {
  try {
    let key = sessionStorage.getItem(IDEMPOTENCY_KEY);
    if (!key) {
      key = newKey();
      sessionStorage.setItem(IDEMPOTENCY_KEY, key);
    }
    return key;
  } catch {
    return newKey();
  }
}

export function clearCheckoutIdempotencyKey() {
  try {
    sessionStorage.removeItem(IDEMPOTENCY_KEY);
  } catch {
    /* ignore */
  }
}

export function needsPrescription(cart) {
  return (cart?.items ?? []).some((item) => item.medicine?.prescriptionRequired);
}

export async function createOrder(values, cart) {
  const delivery = {
    fullName: values.fullName,
    phone: values.phone,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2 ?? "",
    city: values.city,
    postalCode: values.postalCode,
    country: values.country ?? "Bangladesh",
    instructions: values.instructions ?? "",
  };

  const prescription = needsPrescription(cart)
    ? {
        prescriberName: values.prescriberName,
        prescriptionNumber: values.prescriptionNumber,
        documentUrl: values.documentUrl || "",
      }
    : undefined;

  const { data } = await apiClient.post(API_ROUTES.orders.create, {
    idempotencyKey: getCheckoutIdempotencyKey(),
    delivery,
    ...(prescription ? { prescription } : {}),
  });

  return unwrap(data).order;
}

export async function createCheckoutSession(orderId) {
  const { data } = await apiClient.post(API_ROUTES.payments.checkoutSession, {
    orderId,
    idempotencyKey: getCheckoutIdempotencyKey(),
  });

  return unwrap(data).payment;
}

export async function fetchPayment(id) {
  const { data } = await apiClient.get(API_ROUTES.payments.detail(id));
  return unwrap(data).payment;
}

export async function fetchOrder(id) {
  const { data } = await apiClient.get(API_ROUTES.orders.detail(id));
  return unwrap(data).order;
}

export async function downloadInvoice(orderId) {
  const response = await apiClient.get(API_ROUTES.orders.invoice(orderId), {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = `medico-invoice-${String(orderId).slice(-8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
