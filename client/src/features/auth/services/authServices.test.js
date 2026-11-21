import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/constants/roles";

vi.mock("firebase/auth", () => {
  class Provider {
    setCustomParameters() {}
  }

  return {
    createUserWithEmailAndPassword: vi.fn(),
    EmailAuthProvider: { credential: vi.fn() },
    getIdToken: vi.fn(),
    GithubAuthProvider: Provider,
    GoogleAuthProvider: Provider,
    onAuthStateChanged: vi.fn(),
    reauthenticateWithCredential: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    updateEmail: vi.fn(),
    updatePassword: vi.fn(),
    updateProfile: vi.fn(),
  };
});

vi.mock("firebase/storage", () => ({
  getDownloadURL: vi.fn(),
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock("@/config/firebase", () => ({
  app: {},
  auth: { currentUser: { uid: "uid-1", email: "asha@example.com" } },
}));

vi.mock("@/lib/api", () => ({
  apiClient: { post: vi.fn(), patch: vi.fn() },
}));

import {
  createUserWithEmailAndPassword,
  getIdToken,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { apiClient } from "@/lib/api";
import {
  refreshBackendToken,
  registerWithEmail,
  signInWithEmail,
  signInWithSocial,
  toAppUser,
  uploadProfilePhoto,
} from "./authServices";

const firebaseUser = {
  uid: "uid-1",
  email: "asha@example.com",
  displayName: "Asha",
  photoURL: "",
  emailVerified: false,
  providerData: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  getIdToken.mockResolvedValue("firebase-id-token");
  createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
  signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
  signInWithPopup.mockResolvedValue({ user: firebaseUser });
  apiClient.post.mockResolvedValue({
    data: { user: { role: ROLES.USER, uid: "uid-1" }, token: "backend-jwt" },
  });
});

describe("auth services", () => {
  it("never forwards an admin role from the registration form", async () => {
    const result = await registerWithEmail({
      username: "Asha",
      email: "asha@example.com",
      password: "StrongPass1",
      role: ROLES.ADMIN,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({ role: ROLES.USER }),
    );
    expect(result.user.role).toBe(ROLES.USER);
    expect(result.token).toBe("backend-jwt");
  });

  it("keeps the seller role chosen at registration", async () => {
    await registerWithEmail({
      username: "Asha",
      email: "asha@example.com",
      password: "StrongPass1",
      role: ROLES.SELLER,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({ role: ROLES.SELLER }),
    );
  });

  it("exchanges the Firebase token for the backend JWT on login", async () => {
    const result = await signInWithEmail({ email: "asha@example.com", password: "StrongPass1" });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({ idToken: "firebase-id-token", firebaseUid: "uid-1" }),
    );
    expect(result.token).toBe("backend-jwt");
  });

  it("gives social accounts the default user role", async () => {
    for (const provider of ["google", "github"]) {
      const result = await signInWithSocial(provider);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/auth/social",
        expect.objectContaining({ provider, role: ROLES.USER }),
      );
      expect(result.user.role).toBe(ROLES.USER);
    }
  });

  it("exchanges a refresh cookie for a new backend JWT", async () => {
    apiClient.post.mockResolvedValueOnce({ data: { token: "refreshed-jwt" } });

    await expect(refreshBackendToken()).resolves.toBe("refreshed-jwt");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/refresh");
  });

  it("only trusts roles coming from the backend record", () => {
    const user = toAppUser(firebaseUser, { role: ROLES.ADMIN }, ROLES.USER);

    expect(user.role).toBe(ROLES.ADMIN);
    expect(user.email).toBe(firebaseUser.email);
  });

  it("rejects invalid profile photo files before uploading", async () => {
    await expect(uploadProfilePhoto({ type: "text/plain", name: "a.txt", size: 10 })).rejects.toThrow(
      /image/i,
    );
    await expect(
      uploadProfilePhoto({ type: "image/png", name: "a.png", size: 3 * 1024 * 1024 }),
    ).rejects.toThrow(/2 MB/i);
  });
});
