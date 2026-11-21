const TOKEN_KEY = "medico.auth.token";
const USER_KEY = "medico.auth.user";

export function readStoredSession() {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (!rawUser) return null;

    const user = JSON.parse(rawUser);

    if (!user || typeof user !== "object" || !user.uid) return null;

    return { user, token };
  } catch {
    return null;
  }
}

export function writeStoredSession(session) {
  try {
    if (!session?.user) {
      clearStoredSession();
      return;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(session.user));

    if (session.token) {
      localStorage.setItem(TOKEN_KEY, session.token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* Storage may be unavailable (private mode, SSR); in-memory state still works. */
  }
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* Nothing to clear when storage is unavailable. */
  }
}
