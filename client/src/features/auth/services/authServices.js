import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GithubAuthProvider,
  getIdToken,
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
import { normalizeAssignableRole } from "@/constants/roles";
import { PATHS } from "@/utils/paths";
import { readLocalProfile, writeLocalProfile } from "../utils/localProfile";

const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-login-credentials": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-email": "Enter your email address.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Choose a stronger password with at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using another sign-in method.",
  "auth/requires-recent-login": "Please sign in again before making this change.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/operation-not-allowed": "This sign-in method is not enabled for the project.",
  "auth/configuration-not-found":
    "Firebase Authentication is not set up for this project. Open the Firebase console → Authentication, then enable Email/Password and the social providers you use.",
  "auth/invalid-api-key":
    "The Firebase API key is not valid. Check VITE_FIREBASE_API_KEY in client/.env.",
  "auth/api-key-not-valid":
    "The Firebase API key is not valid. Check VITE_FIREBASE_API_KEY in client/.env.",
  "auth/unauthorized-domain":
    "This domain is not authorized for Firebase sign-in. Add it under Authentication → Settings → Authorized domains.",
};

function requireAuth() {
  if (!auth) {
    throw new Error(
      "Firebase authentication is not configured. Add the Firebase environment variables to enable sign-in.",
    );
  }

  return auth;
}

function requireCurrentUser() {
  const current = requireAuth().currentUser;

  if (!current) {
    throw new Error("You need to be signed in to do that.");
  }

  return current;
}

function saveProfile(uid, updates) {
  const current = readLocalProfile(uid) ?? {};

  return writeLocalProfile(uid, { ...current, ...updates });
}

/**
 * Merge the Firebase identity with the app-level profile kept on this device.
 * Firebase always wins for identity fields; the profile supplies role/name.
 */
export function toAppUser(firebaseUser, localProfile = null) {
  if (!firebaseUser) return null;

  const profile = localProfile ?? {};
  const name = profile.name ?? profile.username ?? firebaseUser.displayName ?? "Member";
  const email = firebaseUser.email ?? profile.email ?? "";

  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    name,
    username: profile.username ?? name,
    email,
    photoURL: profile.photoURL || firebaseUser.photoURL || "",
    emailVerified: Boolean(firebaseUser.emailVerified),
    provider: firebaseUser.providerData?.[0]?.providerId ?? "password",
    role: normalizeAssignableRole(profile.role),
  };
}

/**
 * Turns raw Firebase error codes into messages that are safe to show users.
 * Non-Firebase errors pass through unchanged.
 */
export function toAuthError(error) {
  if (!error) {
    return new Error("Something went wrong. Please try again.");
  }

  const code = typeof error.code === "string" ? error.code : "";
  const knownMessage = AUTH_ERROR_MESSAGES[code];

  if (knownMessage) {
    return new Error(knownMessage, { cause: error });
  }

  if (code.startsWith("auth/")) {
    const message = error.message
      ?.replace(/^Firebase:\s*/i, "")
      .replace(/\s*\(auth\/[^)]+\)\.?$/i, "")
      .trim();

    return new Error(message || "Authentication failed. Please try again.", {
      cause: error,
    });
  }

  return error instanceof Error ? error : new Error(String(error));
}

export function observeAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(
    auth,
    (firebaseUser) => {
      callback(
        firebaseUser ? toAppUser(firebaseUser, readLocalProfile(firebaseUser.uid)) : null,
      );
    },
    () => callback(null),
  );
}

export async function registerWithEmail({
  username,
  email,
  password,
  photoURL = "",
  role,
}) {
  const safeRole = normalizeAssignableRole(role);
  const credential = await createUserWithEmailAndPassword(
    requireAuth(),
    email.trim(),
    password,
  );

  try {
    await updateProfile(credential.user, {
      displayName: username,
      photoURL: photoURL || null,
    });
  } catch {
    /* The account exists; the display name can be set again from the profile page. */
  }

  const profile = saveProfile(credential.user.uid, {
    name: username,
    username,
    email: credential.user.email ?? email.trim(),
    photoURL,
    role: safeRole,
  });

  return { user: toAppUser(credential.user, profile) };
}

export async function signInWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(
    requireAuth(),
    email.trim(),
    password,
  );

  return {
    user: toAppUser(credential.user, readLocalProfile(credential.user.uid)),
  };
}

export async function signInWithSocial(providerName) {
  const provider =
    providerName === "github" ? new GithubAuthProvider() : new GoogleAuthProvider();

  if (providerName === "google") {
    provider.setCustomParameters({ prompt: "select_account" });
  }

  const credential = await signInWithPopup(requireAuth(), provider);

  return {
    user: toAppUser(credential.user, readLocalProfile(credential.user.uid)),
  };
}

export async function signOutUser() {
  await signOut(requireAuth());
}

export async function saveUserProfile({ username, photoURL, email }) {
  const current = requireCurrentUser();
  const updates = {};

  if (username) {
    await updateProfile(current, {
      displayName: username,
      photoURL: photoURL !== undefined ? photoURL || null : current.photoURL,
    });
    updates.name = username;
    updates.username = username;
  } else if (photoURL !== undefined) {
    await updateProfile(current, { photoURL: photoURL || null });
  }

  if (photoURL !== undefined) {
    updates.photoURL = photoURL;
  }

  if (email && email.trim().toLowerCase() !== current.email?.toLowerCase()) {
    await updateEmail(current, email.trim());
    updates.email = email.trim();
  }

  const profile = saveProfile(current.uid, updates);

  return { user: toAppUser(current, profile) };
}

export async function changeUserPassword({ currentPassword, newPassword }) {
  const current = requireCurrentUser();
  const usesPassword = current.providerData?.some(
    (provider) => provider.providerId === "password",
  );

  if (!current.email || !usesPassword) {
    throw new Error("Password changes are available for email/password accounts only.");
  }

  const credential = EmailAuthProvider.credential(current.email, currentPassword);

  await reauthenticateWithCredential(current, credential);
  await updatePassword(current, newPassword);
}

export async function resetUserPassword(email) {
  const actionCodeSettings =
    typeof window !== "undefined"
      ? {
          url: `${window.location.origin}${PATHS.LOGIN}`,
          handleCodeInApp: false,
        }
      : undefined;

  try {
    await sendPasswordResetEmail(requireAuth(), email.trim(), actionCodeSettings);
  } catch (error) {
    // Do not reveal whether an account exists for the address.
    if (error?.code === "auth/user-not-found") return;

    throw error;
  }
}

export async function uploadProfilePhoto(file) {
  const current = requireCurrentUser();

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
  const photoRef = ref(
    storage,
    `profile-photos/${current.uid}/${Date.now()}-${safeName}`,
  );

  await uploadBytes(photoRef, file, { contentType: file.type });

  return getDownloadURL(photoRef);
}

export async function getFreshToken(forceRefresh = false) {
  const current = auth?.currentUser;

  return current ? getIdToken(current, forceRefresh) : null;
}
