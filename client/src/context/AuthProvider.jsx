import { useMemo, useState } from "react";
import { AuthContext } from "./authContext.jsx";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Auth-provider integration comes in a later phase. Until then, auth is
  // considered initialized so route guards do not block the app.
  const [loading, setLoading] = useState(false);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      setLoading,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
