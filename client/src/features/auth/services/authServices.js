import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import { env } from "@/config/env";
import { apiClient } from "@/lib/api";
import { isTokenExpired } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { ASSIGNABLE_ROLES, AUTH_PROVIDERS, DEFAULT_SOCIAL_ROLE } from "../constants";

const BACKEND_TOKEN_KEY = "medico.backend.token";

const ROLE_ALIASES = {
  user: ROLES.CUSTOMER,
  customer: ROLES.CUSTOMER,
  seller: ROLES.VENDOR,
  vendor: ROLES.VENDOR,
  admin: ROLES.ADMIN,
  pharmacist: ROLES.PHARMACIST,
};

const BACKEND_FALLBACK_STATUSES = new Set([404, 405, 501]);

export function normalizeRole(value) {
  if (typeof value !== "string") return null;

  return ROLE_ALIASES[value.trim().toLowerCase()] ?? null;
}

function normalizeAssignableRole(value) {
  const role = normalizeRole(value);

  return ASSIGNABLE_ROLES.includes(role) ? role : null;
}

function assertFirebaseConfigured() {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Add your Firebase web keys to the client environment file.",
    );
  }
}

function getCurrentUser() {
  assertFirebaseConfigured();

  if (!auth.currentUser) {
    throw new Error("You need to sign in first.");
  }

  return auth.currentUser;
}

function canUseFirebaseFallback(error) {
  if (!error) return false;

  return (
    error.status == null ||
    BACKEND_FALLBACK_STATUSES.has(error.status) ||
    error.status >= 500
  );
}

export function getStoredBackendToken() {
  if (typeof window === "undefined") return null;

  try {
    const token = window.localStorage.getItem(BACKEND_TOKEN_KEY);

    if (!token || isTokenExpired(token)) {
      window.localStorage.removeItem(BACKEND_TOKEN_KEY);
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

export function storeBackendToken(token) {
  if (typeof window === "undefined" || typeof token !== "string" || !token) {
    return;
  }

  try {
    window.localStorage.setItem(BACKEND_TOKEN_KEY, token);
  } catch {
    // Storage can be unavailable in private mode. The in-memory session still works.
  }
}

export function clearStoredBackendToken() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(BACKEND_TOKEN_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function mapFirebaseUser(firebaseUser, role = DEFAULT_SOCIAL_ROLE) {
  const normalizedRole = normalizeRole(role) ?? DEFAULT_SOCIAL_ROLE;

  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Medico user",
    email: firebaseUser.email ?? "",
    photoURL: firebaseUser.photoURL ?? null,
    role: normalizedRole,
    emailVerified: Boolean(firebaseUser.emailVerified),
  };
}

async function getRoleFromClaims(firebaseUser) {
  try {
    // Force a refresh so role changes made by the backend are picked up.
    const tokenResult = await firebaseUser.getIdTokenResult(true);

    return normalizeRole(tokenResult.claims?.role);
  } catch {
    return null;
  }
}

export async function createFallbackSession(firebaseUser) {
  const role = (await getRoleFromClaims(firebaseUser)) ?? DEFAULT_SOCIAL_ROLE;

  return {
    user: mapFirebaseUser(firebaseUser, role),
    token: null,
    backendToken: null,
    backendSynced: false,
  };
}

function normalizeBackendSession(payload, firebaseUser, fallbackRole, fallbackToken) {
  const data =
    payload &&
    typeof payload === "object" &&
    payload.data &&
    typeof payload.data === "object"
      ? payload.data
      : payload;

  const backendUser =
    data && typeof data === "object" && data.user && typeof data.user === "object"
      ? data.user
      : data && typeof data === "object"
        ? data
        : {};

  const backendToken = (data && (data.token ?? data.accessToken ?? data.jwt)) ?? null;
  const token = backendToken ?? fallbackToken ?? null;

  const baseUser = mapFirebaseUser(firebaseUser, fallbackRole);
  const role = normalizeRole(backendUser.role) ?? baseUser.role;

  return {
    user: {
      ...baseUser,
      uid: backendUser.uid ?? backendUser.id ?? backendUser._id ?? baseUser.uid,
      id: backendUser.id ?? backendUser._id ?? backendUser.uid ?? baseUser.id,
      name:
        backendUser.name ??
        backendUser.username ??
        backendUser.displayName ??
        baseUser.name,
      email: backendUser.email ?? baseUser.email,
      photoURL:
        backendUser.photoURL ??
        backendUser.photoUrl ??
        backendUser.avatar ??
        baseUser.photoURL,
      role,
      phone: backendUser.phone ?? null,
      emailVerified:
        typeof backendUser.emailVerified === "boolean"
          ? backendUser.emailVerified
          : baseUser.emailVerified,
    },
    token,
    backendToken,
    backendSynced: Boolean(data?.user || backendToken),
  };
}

/**
 * Exchanges the Firebase ID token for a backend JWT and a role-aware profile.
 * If the backend sync endpoint is not available yet, the app keeps working in
 * Firebase-only mode so the UI can be developed before the API lands.
 */
export async function resolveSession(firebaseUser, { role, isNewUser = false } = {}) {
  const idToken = await firebaseUser.getIdToken();
  const claimRole = await getRoleFromClaims(firebaseUser);
  const requestedRole = normalizeAssignableRole(role) ?? claimRole ?? DEFAULT_SOCIAL_ROLE;

  try {
    const { data } = await apiClient.post(
      "/auth/sync",
      { role: requestedRole, isNewUser },
      {
        headers: { Authorization: `Bearer ${idToken}` },
        // Prevent a 401 from this exchange from triggering another exchange.
        skipAuthRefresh: true,
      },
    );

    const session = normalizeBackendSession(data, firebaseUser, requestedRole, idToken);

    if (session.backendToken) {
      storeBackendToken(session.backendToken);
    }

    return session;
  } catch (error) {
    if (!canUseFirebaseFallback(error)) {
      throw error;
    }

    console.warn(
      "[auth] Backend session sync is unavailable. Continuing with Firebase only.",
      error?.message,
    );

    return {
      user: mapFirebaseUser(firebaseUser, claimRole ?? requestedRole),
      token: idToken,
      backendToken: null,
      backendSynced: false,
    };
  }
}

export async function registerWithEmail({ name, email, password, photoURL, role }) {
  assertFirebaseConfigured();

  const credential = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(credential.user, {
    displayName: name,
    photoURL: photoURL || null,
  });

  await credential.user.reload();

  return resolveSession(credential.user, {
    role: normalizeAssignableRole(role) ?? ROLES.CUSTOMER,
    isNewUser: true,
  });
}

export async function loginWithEmail({ email, password }) {
  assertFirebaseConfigured();

  const credential = await signInWithEmailAndPassword(auth, email, password);

  return resolveSession(credential.user);
}

export async function signInWithProvider(providerName) {
  assertFirebaseConfigured();

  const provider =
    providerName === AUTH_PROVIDERS.GITHUB
      ? new GithubAuthProvider()
      : new GoogleAuthProvider();

  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);
  const additionalInfo = getAdditionalUserInfo(credential);

  // Social sign-ups always start as a customer. Admin can only be granted by
  // the backend through custom claims.
  return resolveSession(credential.user, {
    role: DEFAULT_SOCIAL_ROLE,
    isNewUser: Boolean(additionalInfo?.isNewUser),
  });
}

export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }

  clearStoredBackendToken();
}

export async function updateProfileDetails({ name, photoURL }) {
  const firebaseUser = getCurrentUser();

  await updateProfile(firebaseUser, {
    displayName: name,
    photoURL: photoURL || null,
  });

  await firebaseUser.reload();

  const role = (await getRoleFromClaims(firebaseUser)) ?? DEFAULT_SOCIAL_ROLE;
  const localUser = mapFirebaseUser(firebaseUser, role);

  try {
    const { data } = await apiClient.patch("/auth/profile", {
      name,
      photoURL: photoURL || null,
    });

    const session = normalizeBackendSession(data, firebaseUser, role, null);

    if (session.backendToken) {
      storeBackendToken(session.backendToken);
    }

    return session.user;
  } catch (error) {
    if (!canUseFirebaseFallback(error)) {
      console.warn(
        "[auth] Profile was updated in Firebase but not synced to the API.",
        error,
      );
    }

    return localUser;
  }
}

export async function uploadAvatar(file) {
  if (!file) {
    throw new Error("Choose an image first.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image must be 2 MB or smaller.");
  }

  const uploadKey = env.VITE_IMAGE_UPLOAD_KEY;

  if (!uploadKey || uploadKey.startsWith("demo")) {
    throw new Error(
      "Image upload is not configured. Add VITE_IMAGE_UPLOAD_KEY or paste an image URL instead.",
    );
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${encodeURIComponent(uploadKey)}`,
    { method: "POST", body: formData },
  );

  if (!response.ok) {
    throw new Error("Image upload failed. Try a different image or paste a URL.");
  }

  const payload = await response.json();
  const url = payload?.data?.display_url ?? payload?.data?.url;

  if (!url) {
    throw new Error("Image upload did not return a URL.");
  }

  return url;
}
