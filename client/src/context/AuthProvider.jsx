import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase";
import { setAccessTokenGetter, setUnauthorizedHandler } from "@/lib/api";
import {
  clearStoredBackendToken,
  createFallbackSession,
  getStoredBackendToken,
  loginWithEmail,
  logoutUser,
  registerWithEmail,
  resolveSession,
  signInWithProvider,
  updateProfileDetails,
  uploadAvatar,
} from "@/features/auth/services/authServices";
import { AuthContext } from "./authContext.jsx";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const userRef = useRef(null);
  const refreshPromiseRef = useRef(null);

  const applySession = useCallback((session) => {
    userRef.current = session?.user ?? null;
    setUser(session?.user ?? null);
  }, []);

  const refreshBackendSession = useCallback(async () => {
    if (!auth?.currentUser) {
      return null;
    }

    // Collapse concurrent 401 responses into a single token exchange.
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = (async () => {
        clearStoredBackendToken();
        const session = await resolveSession(auth.currentUser);
        applySession(session);
        return session.token;
      })().finally(() => {
        refreshPromiseRef.current = null;
      });
    }

    return refreshPromiseRef.current;
  }, [applySession]);

  /**
   * The Axios client asks for a token on every request. Prefer the backend JWT
   * when present, otherwise fall back to a fresh Firebase ID token.
   */
  useEffect(() => {
    setAccessTokenGetter(async () => {
      const backendToken = getStoredBackendToken();

      if (backendToken) {
        return backendToken;
      }

      if (auth?.currentUser) {
        try {
          return await auth.currentUser.getIdToken();
        } catch {
          return null;
        }
      }

      return null;
    });

    return () => setAccessTokenGetter(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(refreshBackendSession);

    return () => setUnauthorizedHandler(null);
  }, [refreshBackendSession]);

  /**
   * Firebase persists the session across reloads. On every restored session we
   * exchange the ID token for a backend JWT (when the API supports it).
   */
  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearStoredBackendToken();
        applySession(null);
        setLoading(false);
        return;
      }

      // A login/register action may have already applied a richer session.
      if (userRef.current?.uid === firebaseUser.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        applySession(await resolveSession(firebaseUser));
      } catch (error) {
        console.warn("[auth] Could not restore the backend session.", error);
        applySession(await createFallbackSession(firebaseUser));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [applySession]);

  const register = useCallback(
    async (payload) => {
      const session = await registerWithEmail(payload);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const login = useCallback(
    async (payload) => {
      const session = await loginWithEmail(payload);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const loginWithProvider = useCallback(
    async (providerName) => {
      const session = await signInWithProvider(providerName);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await logoutUser();
    clearStoredBackendToken();
    applySession(null);
  }, [applySession]);

  const updateProfile = useCallback(
    async (payload) => {
      const updatedUser = await updateProfileDetails(payload);
      applySession({ user: updatedUser });
      return updatedUser;
    },
    [applySession],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      register,
      login,
      loginWithProvider,
      logout,
      updateProfile,
      uploadAvatar,
    }),
    [user, loading, register, login, loginWithProvider, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
