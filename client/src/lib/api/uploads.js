import { apiClient } from "./client";

/**
 * Uploads a medicine image to the server (imgbb, kept secret server-side).
 * The returned `url` can be stored in Medicine.images / a product image field.
 */
export async function uploadImage(file, { field = "image" } = {}) {
  const form = new FormData();
  form.append(field, file);

  const response = await apiClient.post("/uploads/image", form);
  return response.data?.data ?? response.data;
}
