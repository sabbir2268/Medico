import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/constants/roles";

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  getIdToken: vi.fn(),
  GithubAuthProvider: class {},
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("firebase/storage", () => ({
  getDownloadURL: vi.fn(),
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock("@/config/firebase", () => ({ app: null, auth: null }));

vi.mock("@/lib/api", () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}));

import { apiClient } from "@/lib/api";
import { getAccessToken, getRefreshToken } from "../utils/tokenStore";
import {
  exchangeFirebaseSession,
  loginWithBackend,
  logoutBackend,
  registerWithBackend,
  toBackendAppUser,
} from "./authServices";

const session = {
  user: {
    id: "u1",
    username: "Asha",
    email: "asha@example.com",
    role: ROLES.SELLER,
    provider: "password",
  },
  accessToken: "access-jwt",
  refreshToken: "refresh-jwt",
  tokenType: "Bearer",
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  apiClient.post.mockResolvedValue({ data: { success: true, data: session } });
});

describe("backend auth services", () => {
  it("registers through the backend and persists issued JWTs", async () => {
    const result = await registerWithBackend({
      username: "Asha",
      email: "asha@example.com",
      password: "StrongPass1",
      role: ROLES.SELLER,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({ role: ROLES.SELLER }),
    );
    expect(result.user.role).toBe(ROLES.SELLER);
    expect(getAccessToken()).toBe("access-jwt");
    expect(getRefreshToken()).toBe("refresh-jwt");
  });

  it("logs in through the backend", async () => {
    const result = await loginWithBackend({ email: "asha@example.com", password: "StrongPass1" });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
      email: "asha@example.com",
      password: "StrongPass1",
    });
    expect(result.user.id).toBe("u1");
  });

  it("exchanges a Firebase token for a backend session", async () => {
    const result = await exchangeFirebaseSession("firebase-id-token");

    expect(apiClient.post).toHaveBeenCalledWith("/auth/firebase", {
      idToken: "firebase-id-token",
    });
    expect(result.role).toBe(ROLES.SELLER);
  });

  it("keeps privileged roles only when the backend returns them", () => {
    expect(toBackendAppUser({ ...session.user, role: ROLES.ADMIN }).role).toBe(ROLES.ADMIN);
    expect(toBackendAppUser({ ...session.user, role: "superuser" }).role).toBe(ROLES.USER);
  });

  it("clears stored tokens on logout even when the request fails", async () => {
    localStorage.setItem("medico.auth.accessToken", "access-jwt");
    localStorage.setItem("medico.auth.refreshToken", "refresh-jwt");
    apiClient.post.mockRejectedValueOnce(new Error("offline"));

    await expect(logoutBackend()).rejects.toThrow("offline");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
