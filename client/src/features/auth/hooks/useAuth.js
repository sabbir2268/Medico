import { useContext } from "react";
import { AuthContext } from "../../../context/authContext.jsx";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  const roles = Array.isArray(context.role) ? context.role : [context.role];

  return {
    ...context,
    isAuthenticated: Boolean(context.user),
    hasRole: (allowed) => {
      const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

      return allowedRoles.some((role) => roles.includes(role));
    },
  };
}
