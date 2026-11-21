import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setAccessTokenGetter, setTokenRefresher } from "@/lib/api";
import { notify } from "@/lib/notify";
import { ROLES } from "@/constants/roles";
import { AuthContext } from "./authContext.jsx";
import * as authService from "@/features/auth/services/authServices";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "@/features/auth/utils/sessionStorage";

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readStoredSession());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const tokenRef = useRef(session?.token ?? null);

  useEffect(() => {
    setAccessTokenGetter(() => tokenRef.current);

    return () => setAccessTokenGetter(null);
  }, []);

  const applySession = useCallback((next) => {
    const normalized = next?.user ? { user: next.user, token: next.token ?? null } : null;

    tokenRef.current = normalized?.token ?? null;
    setSession(normalized);

    if (normalized) {
      writeStoredSession(normalized);
    } else {
      clearStoredSession();
    }

    return normalized;
  }, []);

  /**
   * Firebase owns the session lifecycle; localStorage only restores the app
   * record (including the backend JWT) between reloads.
   */
  useEffect(() => {
    let active = true;

    const unsubscribe = authService.observeAuth((firebaseUser) => {
      if (!active) return;

      const cached = readStoredSession();
      const isSameUser = Boolean(cached && firebaseUser && cached.user.uid === firebaseUser.uid);

      if (!firebaseUser) {
        applySession(null);
      } else {
        applySession({
          user: isSameUser ? cached.user : authService.toAppUser(firebaseUser),
          token: isSameUser ? cached.token : null,
        });
      }

      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [applySession]);

  const runAction = useCallback(
    async (action, successMessage) => {
      setSubmitting(true);
      setError(null);

      try {
        const next = await action();

        if (next?.user) applySession(next);
        if (successMessage) notify.success(successMessage);

        return next;
      } catch (caught) {
        setError(caught);
        notify.error(caught);

        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [applySession],
  );

  const login = useCallback(
    (values) => runAction(() => authService.signInWithEmail(values), "Welcome back to Medico!"),
    [runAction],
  );

  const register = useCallback(
    (values) =>
      runAction(() => authService.registerWithEmail(values), "Your account is ready. Welcome to Medico!"),
    [runAction],
  );

  const loginWithGoogle = useCallback(
    () => runAction(() => authService.signInWithSocial("google"), "Signed in with Google."),
    [runAction],
  );

  const loginWithGitHub = useCallback(
    () => runAction(() => authService.signInWithSocial("github"), "Signed in with GitHub."),
    [runAction],
  );

  const logout = useCallback(async () => {
    setSubmitting(true);

    try {
      await authService.signOutUser();
      notify.success("You have been signed out.");
    } catch (caught) {
      notify.error(caught);
    } finally {
      applySession(null);
      setSubmitting(false);
    }
  }, [applySession]);

  const updateProfile = useCallback(
    (values) =>
      runAction(
        () => authService.saveUserProfile({ ...values, role: session?.user?.role }),
        "Profile updated successfully.",
      ),
    [runAction, session?.user?.role],
  );

  const changePassword = useCallback(
    (values) =>
      runAction(async () => {
        await authService.changeUserPassword(values);

        return true;
      }, "Password changed successfully."),
    [runAction],
  );

  const resetPassword = useCallback(async (email) => {
    setSubmitting(true);
    setError(null);

    try {
      await authService.resetUserPassword(email);
      notify.success("A password reset link has been sent to your email.");

      return true;
    } catch (caught) {
      setError(caught);
      notify.error(caught);

      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const token = await authService.refreshBackendToken();

    if (!token) return null;

    setSession((current) => {
      if (!current) return current;

      const next = { ...current, token };
      tokenRef.current = token;
      writeStoredSession(next);

      return next;
    });

    return token;
  }, []);

  useEffect(() => {
    setTokenRefresher(() => refreshSession());

    return () => setTokenRefresher(null);
  }, [refreshSession]);

  const uploadPhoto = useCallback(async (file) => {
    try {
      return await authService.uploadProfilePhoto(file);
    } catch (caught) {
      notify.error(caught);

      return null;
    }
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;

    return {
      user,
      token: session?.token ?? null,
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
      refreshSession,
      uploadPhoto,
      clearError: () => setError(null),
    };
  }, [
    session,
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
    refreshSession,
    uploadPhoto,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
