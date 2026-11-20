import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Loader } from "@/components/ui/Loader";
import { PATHS } from "@/utils/paths";

export default function PublicRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Loading..." />;

  if (user) {
    const redirectTo = location.state?.from?.pathname ?? PATHS.DASHBOARD;
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
