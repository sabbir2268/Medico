import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Loader } from "@/components/ui/Loader";
import { PATHS } from "@/utils/paths";

function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    // Remember where they were going so login can send them back.
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default PrivateRoute;
