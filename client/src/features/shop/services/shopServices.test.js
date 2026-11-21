import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  apiClient: { get: vi.fn() },
}));

vi.mock("@/config/env", () => ({
  env: { VITE_USE_FALLBACK_DATA: false },
}));

import { apiClient } from "@/lib/api";
import { getMedicines } from "./shopServices";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("shop services", () => {
  it("maps catalog filters to the medicines endpoint params", async () => {
    apiClient.get.mockResolvedValue({
      data: { success: true, data: { items: [], pagination: {} } },
    });

    await getMedicines({
      search: "paracetamol",
      category: "cat-otc",
      sort: "price_desc",
      page: 2,
      limit: 20,
    });

    expect(apiClient.get).toHaveBeenCalledWith("/medicines", {
      params: {
        search: "paracetamol",
        category: "cat-otc",
        sort: "-price",
        page: 2,
        limit: 20,
      },
    });
  });

  it("translates ascending price sorting", async () => {
    apiClient.get.mockResolvedValue({ data: { items: [], pagination: {} } });

    await getMedicines({ sort: "price_asc" });

    expect(apiClient.get).toHaveBeenCalledWith("/medicines", {
      params: { sort: "price", page: 1, limit: 10 },
    });
  });

  it("normalizes the shared response envelope and pagination", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [{ id: "med-1", name: "Test" }],
          pagination: { page: 3, limit: 5, total: 42, totalPages: 9 },
        },
      },
    });

    const result = await getMedicines({ page: 3, limit: 5 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({
      page: 3,
      limit: 5,
      total: 42,
      totalPages: 9,
      hasNext: true,
      hasPrev: true,
    });
    expect(result.isFallback).toBe(false);
  });

  it("propagates API errors when fallback data is disabled", async () => {
    apiClient.get.mockRejectedValue(new Error("Catalog unavailable"));

    await expect(getMedicines()).rejects.toThrow("Catalog unavailable");
  });
});
