import { useCallback, useEffect, useMemo, useState } from "react";
import { setAccessTokenGetter, setTokenRefresher } from "@/lib/api";
import { notify } from "@/lib/notify";
import { env } from "@/config/env";
import { AuthContext } from "./authContext.jsx";
import * as authService from "@/features/auth/services/authServices";
import { clearTokens, hasBackendSession } from "@/features/auth/utils/tokenStore";
import { isConfiguredAdminEmail, normalizeUserForApp } from "@/features/auth/utils/adminEmail";
import { mergeGuestCart } from "@/features/cart/services/cartServices";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Firebase owns the session. Requests carry a fresh Firebase ID token so
   * future protected API routes can verify it with the Admin SDK.
   */
  useEffect(() => {
    setAccessTokenGetter(() => authService.getApiAccessToken() ?? authService.getFreshToken());
    setTokenRefresher(() => authService.refreshApiAccessToken());

    return () => {
      setAccessTokenGetter(null);
      setTokenRefresher(null);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = authService.observeAuth((nextUser) => {
      if (!active) return;

      setUser(normalizeUserForApp(nextUser));
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // Merge any locally stored guest cart once the user is signed in.
  useEffect(() => {
    if (!loading && user && hasBackendSession()) {
      mergeGuestCart().catch(() => {
        /* A missing backend session simply leaves the guest cart in place. */
      });
    }
  }, [loading, user]);

  const runAction = useCallback(async (action, successMessage, { updateUser = true } = {}) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await action();

      if (updateUser && result?.user) setUser(normalizeUserForApp(result.user));
      if (successMessage) notify.success(successMessage);

      return result;
    } catch (caught) {
      const friendly = authService.toAuthError(caught);

      setError(friendly);
      notify.error(friendly);

      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const login = useCallback(
    (values) =>
      runAction(
        () =>
          env.VITE_AUTH_MODE === "backend"
            ? authService.loginWithBackend(values)
            : authService.signInWithEmail(values),
        "Welcome back to Medico!",
      ),
    [runAction],
  );

  const register = useCallback(
    async (values) => {
      // Registration creates the account but must NOT start a signed-in
      // session: the user is sent to /login to authenticate explicitly, and
      // PublicRoute would otherwise bounce them straight back to /dashboard.
      const result = await runAction(
        () =>
          env.VITE_AUTH_MODE === "backend"
            ? authService.registerWithBackend(values)
            : authService.registerWithEmail(values),
        "Account created. Please log in to continue.",
        { updateUser: false },
      );

      if (result) {
        clearTokens();

        if (authService.isFirebaseEnabled()) {
          await authService.signOutUser().catch(() => {
            /* A missing Firebase session is fine in backend mode. */
          });
        }
      }

      return result;
    },
    [runAction],
  );

  const loginWithGoogle = useCallback(
    () =>
      runAction(() => authService.signInWithSocial("google"), "Signed in with Google."),
    [runAction],
  );

  const loginWithGitHub = useCallback(
    () =>
      runAction(() => authService.signInWithSocial("github"), "Signed in with GitHub."),
    [runAction],
  );

  const logout = useCallback(async () => {
    setSubmitting(true);

    try {
      await authService.logoutBackend();

      if (authService.isFirebaseEnabled()) await authService.signOutUser();

      notify.success("You have been signed out.");
    } catch (caught) {
      notify.error(authService.toAuthError(caught));
    } finally {
      setUser(null);
      setSubmitting(false);
    }
  }, []);

  const updateProfile = useCallback(
    (values) =>
      runAction(
        () =>
          hasBackendSession()
            ? authService.patchBackendProfile(values)
            : authService.saveUserProfile(values),
        "Profile updated successfully.",
      ),
    [runAction],
  );

  const changePassword = useCallback(
    (values) =>
      runAction(async () => {
        await authService.changeUserPassword(values);

        return true;
      }, "Password changed successfully."),
    [runAction],
  );

  const resetPassword = useCallback(
    (email) =>
      runAction(async () => {
        await authService.resetUserPassword(email);

        return true;
      }, "If an account exists for that email, a reset link is on its way."),
    [runAction],
  );

  const uploadPhoto = useCallback(async (file) => {
    try {
      return await authService.uploadProfilePhoto(file);
    } catch (caught) {
      notify.error(authService.toAuthError(caught));

      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      submitting,
      error,
      isAuthenticated: Boolean(user),
      role: user?.role ?? null,
      // The allowlisted email is the single source of truth for admin access.
      isAdmin: isConfiguredAdminEmail(user?.email),
      login,
      register,
      loginWithGoogle,
      loginWithGitHub,
      logout,
      updateProfile,
      changePassword,
      resetPassword,
      uploadPhoto,
      clearError: () => setError(null),
    }),
    [
      user,
      loading,
      submitting,
      error,
      login,
      register,
      loginWithGoogle,
      loginWithGitHub,
      logout,
      updateProfile,
      changePassword,
      resetPassword,
      uploadPhoto,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
