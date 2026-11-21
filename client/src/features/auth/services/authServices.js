import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getIdToken,
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app, auth } from "@/config/firebase";
import { env } from "@/config/env";
import { apiClient } from "@/lib/api";
import { ROLES, normalizeAssignableRole } from "@/constants/roles";
import { AUTH_ENDPOINTS } from "../constants/authEndpoints";

function requireAuth() {
  if (!auth) {
    throw new Error(
      "Firebase authentication is not configured. Add the Firebase environment variables to enable sign-in.",
    );
  }

  return auth;
}

function unwrap(payload) {
  return payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
}

function canUseFirebaseOnly(error) {
  if (!env.VITE_ALLOW_FIREBASE_ONLY_AUTH) return false;

  const status = error?.status ?? error?.response?.status;

  return !status || status === 404 || status === 501 || status === 503;
}

/**
 * Firebase identity + the trusted server record are merged into one app user.
 * A missing server response falls back to the sanitized, client-known values.
 */
export function toAppUser(firebaseUser, serverUser = null, requestedRole = null, localProfile = {}) {
  if (!firebaseUser) return null;

  const server = Object.fromEntries(
    Object.entries(serverUser ?? {}).filter(([, value]) => value !== undefined && value !== null),
  );
  const name = server.name ?? localProfile.name ?? firebaseUser.displayName ?? "Member";
  const email = firebaseUser.email ?? server.email ?? localProfile.email ?? "";

  const user = {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    name,
    username: server.username ?? localProfile.username ?? name,
    email,
    photoURL: server.photoURL ?? localProfile.photoURL ?? firebaseUser.photoURL ?? "",
    emailVerified: firebaseUser.emailVerified ?? false,
    provider: firebaseUser.providerData?.[0]?.providerId ?? "password",
    role: server.role ?? normalizeAssignableRole(requestedRole ?? ROLES.USER),
  };

  if (!Object.keys(server).length) return user;

  return {
    ...user,
    ...server,
    uid: server.uid ?? firebaseUser.uid,
    id: server.id ?? firebaseUser.uid,
    email,
    role: server.role ?? user.role,
  };
}

async function syncWithBackend({ method = "post", endpoint, payload, firebaseUser, requestedRole, localProfile }) {
  try {
    const { data } = await apiClient[method](endpoint, payload);
    const body = unwrap(data);

    return {
      user: toAppUser(firebaseUser, body?.user ?? body ?? null, requestedRole, localProfile),
      token: body?.token ?? body?.accessToken ?? null,
    };
  } catch (error) {
    if (!canUseFirebaseOnly(error)) throw error;

    return {
      user: toAppUser(firebaseUser, null, requestedRole, localProfile),
      token: null,
    };
  }
}

export function observeAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(
    auth,
    callback,
    () => callback(null),
  );
}

export async function registerWithEmail({ username, email, password, photoURL = "", role }) {
  const safeRole = normalizeAssignableRole(role);
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);

  try {
    await updateProfile(credential.user, {
      displayName: username,
      photoURL: photoURL || null,
    });
  } catch {
    /* Firebase account exists; the profile can be completed later. */
  }

  const idToken = await getIdToken(credential.user);

  return syncWithBackend({
    endpoint: AUTH_ENDPOINTS.register,
    payload: {
      name: username,
      username,
      email,
      photoURL,
      role: safeRole,
      firebaseUid: credential.user.uid,
      idToken,
    },
    firebaseUser: credential.user,
    requestedRole: safeRole,
    localProfile: { name: username, username, photoURL, email },
  });
}

export async function signInWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password);
  const idToken = await getIdToken(credential.user);

  return syncWithBackend({
    endpoint: AUTH_ENDPOINTS.login,
    payload: { email, firebaseUid: credential.user.uid, idToken },
    firebaseUser: credential.user,
    requestedRole: ROLES.USER,
    localProfile: { email },
  });
}

export async function signInWithSocial(providerName) {
  const provider =
    providerName === "github" ? new GithubAuthProvider() : new GoogleAuthProvider();

  if (providerName === "google") {
    provider.setCustomParameters({ prompt: "select_account" });
  }

  const credential = await signInWithPopup(requireAuth(), provider);
  const idToken = await getIdToken(credential.user);

  // Social accounts never carry an assignable privileged role.
  return syncWithBackend({
    endpoint: AUTH_ENDPOINTS.social,
    payload: { provider: providerName, role: ROLES.USER, idToken },
    firebaseUser: credential.user,
    requestedRole: ROLES.USER,
  });
}

export async function signOutUser() {
  try {
    await apiClient.post(AUTH_ENDPOINTS.logout);
  } catch {
    /* Signing out locally must never depend on backend availability. */
  }

  await signOut(requireAuth());
}

export async function saveUserProfile({ username, photoURL, email, role }) {
  const current = requireAuth().currentUser;

  if (!current) {
    throw new Error("You need to be signed in to update your profile.");
  }

  if (username || photoURL !== undefined) {
    await updateProfile(current, {
      displayName: username || current.displayName,
      photoURL: photoURL || null,
    });
  }

  if (email && email !== current.email) {
    await updateEmail(current, email);
  }

  const idToken = await getIdToken(current);

  return syncWithBackend({
    method: "patch",
    endpoint: AUTH_ENDPOINTS.profile,
    payload: { name: username, username, photoURL, email, idToken },
    firebaseUser: current,
    requestedRole: role ?? ROLES.USER,
    localProfile: { name: username, username, photoURL },
  });
}

export async function changeUserPassword({ currentPassword, newPassword }) {
  const current = requireAuth().currentUser;

  if (!current?.email) {
    throw new Error("Password changes are available for email-based accounts only.");
  }

  const credential = EmailAuthProvider.credential(current.email, currentPassword);
  await reauthenticateWithCredential(current, credential);
  await updatePassword(current, newPassword);
}

export async function resetUserPassword(email) {
  await sendPasswordResetEmail(requireAuth(), email);
}

export async function uploadProfilePhoto(file) {
  const current = requireAuth().currentUser;

  if (!current) {
    throw new Error("Sign in before uploading a profile photo.");
  }

  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please choose an image file for your profile photo.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Profile photos must be smaller than 2 MB.");
  }

  if (!app) {
    throw new Error("Firebase Storage is not configured for photo uploads.");
  }

  const storage = getStorage(app);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const photoRef = ref(storage, `profile-photos/${current.uid}/${Date.now()}-${safeName}`);

  await uploadBytes(photoRef, file, { contentType: file.type });

  return getDownloadURL(photoRef);
}

export async function getFreshToken() {
  const current = auth?.currentUser;

  return current ? getIdToken(current, true) : null;
}

export async function refreshBackendToken() {
  const token = await apiClient
    .post(AUTH_ENDPOINTS.refresh)
    .then(({ data }) => {
      const body = unwrap(data);

      return body?.token ?? body?.accessToken ?? (typeof body === "string" ? body : null);
    })
    .catch(() => null);

  return token ?? (env.VITE_ALLOW_FIREBASE_ONLY_AUTH ? getFreshToken() : null);
}
