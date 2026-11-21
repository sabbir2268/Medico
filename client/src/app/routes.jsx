import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "@/features/home/pages/Home";
import About from "@/features/about/pages/About";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import DashboardHome from "@/features/dashboard/pages/DashboardHome";
import SellerHome from "@/features/dashboard/pages/SellerHome";
import Profile from "@/features/auth/pages/Profile";
import NotFound from "@/pages/NotFound";
import ErrorPage from "@/pages/ErrorPage";
import { ROLES } from "@/constants/roles";
import { PrivateRoute, PublicRoute, RoleRoute } from "@/routes";
import { PATHS } from "@/utils/paths";

/**
 * Central route map. Add customer, vendor, and admin sections inside the
 * private group. Role-scoped sections can use RoleRoute, for example:
 *
 * { element: <RoleRoute allowedRoles={[ROLES.VENDOR]} />, children: [...] }
 */
export const routes = [
  {
    // Pathless root: catches errors from every route below.
    errorElement: <ErrorPage />,
    children: [
      {
        path: PATHS.HOME,
        element: <PublicLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "about", element: <About /> },
          { path: "*", element: <NotFound /> },
        ],
      },

      // Guest-only pages: authenticated users are redirected away.
      {
        element: <PublicRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: PATHS.LOGIN, element: <Login /> },
              { path: PATHS.REGISTER, element: <Register /> },
            ],
          },
        ],
      },

      // Authenticated pages.
      {
        element: <PrivateRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: PATHS.DASHBOARD, element: <DashboardHome /> },
              { path: PATHS.PROFILE, element: <Profile /> },
              {
                element: <RoleRoute allowedRoles={[ROLES.SELLER]} />,
                children: [{ path: PATHS.SELLER, element: <SellerHome /> }],
              },
            ],
          },
        ],
      },
    ],
  },
];
