import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Loader } from "@/components/ui/Loader";
import { PATHS } from "@/utils/paths";

/**
 * Requires an authenticated user and optionally one of the allowed roles.
 * `user.role` is expected to be a single role string.
 */
export default function RoleRoute({ allowedRoles = [], redirectTo = PATHS.HOME }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader label="Checking permissions..." />;
  }

  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }

  const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
