import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, setAccessTokenGetter, setTokenRefresher } from "./client";

function success(config) {
  return Promise.resolve({
    data: { ok: true },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
}

function unauthorized(config) {
  const error = new Error("Unauthorized");

  error.isAxiosError = true;
  error.config = config;
  error.response = { status: 401, data: { message: "Unauthorized" }, headers: {}, config };

  return Promise.reject(error);
}

function authHeader(config) {
  return config.headers?.get ? config.headers.get("Authorization") : config.headers?.Authorization;
}

beforeEach(() => {
  setAccessTokenGetter(() => "stored-jwt");
  setTokenRefresher(null);
  apiClient.defaults.adapter = vi.fn();
});

afterEach(() => {
  setAccessTokenGetter(null);
  setTokenRefresher(null);
});

describe("centralized API client", () => {
  it("sends the stored JWT as a bearer token", async () => {
    apiClient.defaults.adapter.mockImplementationOnce(success);

    await apiClient.get("/auth/me");

    expect(authHeader(apiClient.defaults.adapter.mock.calls[0][0])).toBe("Bearer stored-jwt");
  });

  it("refreshes the token once and retries after a 401", async () => {
    const refresher = vi.fn().mockResolvedValue("fresh-jwt");

    setTokenRefresher(refresher);
    apiClient.defaults.adapter.mockImplementationOnce(unauthorized).mockImplementationOnce(success);

    const response = await apiClient.get("/orders");

    expect(response.status).toBe(200);
    expect(refresher).toHaveBeenCalledOnce();
    expect(authHeader(apiClient.defaults.adapter.mock.calls[1][0])).toBe("Bearer fresh-jwt");
  });

  it("does not try to refresh during the login exchange", async () => {
    const refresher = vi.fn().mockResolvedValue("fresh-jwt");

    setTokenRefresher(refresher);
    apiClient.defaults.adapter.mockImplementationOnce(unauthorized);

    await expect(apiClient.post("/auth/login", {})).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
    expect(refresher).not.toHaveBeenCalled();
  });
});
