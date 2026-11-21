import { useCallback, useEffect, useMemo, useState } from "react";
import { setAccessTokenGetter, setTokenRefresher } from "@/lib/api";
import { notify } from "@/lib/notify";
import { ROLES } from "@/constants/roles";
import { AuthContext } from "./authContext.jsx";
import * as authService from "@/features/auth/services/authServices";

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
    setAccessTokenGetter(() => authService.getFreshToken());
    setTokenRefresher(() => authService.getFreshToken(true));

    return () => {
      setAccessTokenGetter(null);
      setTokenRefresher(null);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = authService.observeAuth((nextUser) => {
      if (!active) return;

      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const runAction = useCallback(async (action, successMessage) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await action();

      if (result?.user) setUser(result.user);
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
      runAction(() => authService.signInWithEmail(values), "Welcome back to Medico!"),
    [runAction],
  );

  const register = useCallback(
    (values) =>
      runAction(
        () => authService.registerWithEmail(values),
        "Your account is ready. Welcome to Medico!",
      ),
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
      await authService.signOutUser();
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
        () => authService.saveUserProfile(values),
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
      isAdmin: user?.role === ROLES.ADMIN,
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
