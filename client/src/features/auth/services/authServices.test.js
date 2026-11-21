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
  auth: {
    currentUser: {
      uid: "uid-1",
      email: "asha@example.com",
      providerData: [{ providerId: "password" }],
    },
  },
}));

import {
  createUserWithEmailAndPassword,
  getIdToken,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { readLocalProfile, writeLocalProfile } from "../utils/localProfile";
import {
  getFreshToken,
  registerWithEmail,
  resetUserPassword,
  signInWithEmail,
  signInWithSocial,
  toAppUser,
  toAuthError,
  uploadProfilePhoto,
} from "./authServices";

const firebaseUser = {
  uid: "uid-1",
  email: "asha@example.com",
  displayName: "Asha",
  photoURL: "",
  emailVerified: false,
  providerData: [{ providerId: "password" }],
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  getIdToken.mockResolvedValue("firebase-id-token");
  createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
  signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
  signInWithPopup.mockResolvedValue({ user: firebaseUser });
  sendPasswordResetEmail.mockResolvedValue(undefined);
});

describe("auth services", () => {
  it("never forwards an admin role from the registration form", async () => {
    const result = await registerWithEmail({
      username: "Asha",
      email: "asha@example.com",
      password: "StrongPass1",
      role: ROLES.ADMIN,
    });

    expect(updateProfile).toHaveBeenCalledWith(
      firebaseUser,
      expect.objectContaining({ displayName: "Asha" }),
    );
    expect(result.user.role).toBe(ROLES.USER);
    expect(readLocalProfile("uid-1").role).toBe(ROLES.USER);
  });

  it("keeps the seller role chosen at registration", async () => {
    const result = await registerWithEmail({
      username: "Asha",
      email: "asha@example.com",
      password: "StrongPass1",
      role: ROLES.SELLER,
    });

    expect(result.user.role).toBe(ROLES.SELLER);
    expect(readLocalProfile("uid-1")).toMatchObject({
      username: "Asha",
      role: ROLES.SELLER,
    });
  });

  it("restores the saved role when a user signs back in", async () => {
    writeLocalProfile("uid-1", { name: "Asha", username: "Asha", role: ROLES.SELLER });

    const result = await signInWithEmail({
      email: "asha@example.com",
      password: "StrongPass1",
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "asha@example.com",
      "StrongPass1",
    );
    expect(result.user.role).toBe(ROLES.SELLER);
  });

  it("gives social accounts the default user role", async () => {
    for (const provider of ["google", "github"]) {
      const result = await signInWithSocial(provider);

      expect(signInWithPopup).toHaveBeenCalledWith(expect.anything(), expect.anything());
      expect(result.user.role).toBe(ROLES.USER);
    }
  });

  it("sends a Firebase password reset email", async () => {
    await resetUserPassword(" asha@example.com ");

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "asha@example.com",
      expect.objectContaining({ handleCodeInApp: false }),
    );
  });

  it("merges the local profile with the Firebase identity", () => {
    const user = toAppUser(
      { ...firebaseUser, displayName: "Firebase Name" },
      { name: "Asha", username: "Asha", role: ROLES.SELLER },
    );

    expect(user).toMatchObject({
      uid: "uid-1",
      name: "Asha",
      username: "Asha",
      email: "asha@example.com",
      role: ROLES.SELLER,
    });
  });

  it("maps Firebase errors to friendly messages", () => {
    expect(toAuthError({ code: "auth/invalid-credential" }).message).toMatch(
      /incorrect/i,
    );
    expect(toAuthError({ code: "auth/email-already-in-use" }).message).toMatch(
      /already exists/i,
    );
    expect(toAuthError({ code: "auth/configuration-not-found" }).message).toMatch(
      /authentication is not set up/i,
    );
    expect(toAuthError(new Error("Custom error")).message).toBe("Custom error");
  });

  it("returns a fresh Firebase token for API requests", async () => {
    await expect(getFreshToken()).resolves.toBe("firebase-id-token");
    expect(getIdToken).toHaveBeenCalledWith(expect.anything(), false);
  });

  it("rejects invalid profile photo files before uploading", async () => {
    await expect(
      uploadProfilePhoto({ type: "text/plain", name: "a.txt", size: 10 }),
    ).rejects.toThrow(/image/i);
    await expect(
      uploadProfilePhoto({ type: "image/png", name: "a.png", size: 3 * 1024 * 1024 }),
    ).rejects.toThrow(/2 MB/i);
  });
});
