import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "@/features/home/pages/Home";
import About from "@/features/about/pages/About";
import Shop from "@/features/shop/pages/Shop";
import Deals from "@/features/shop/pages/Deals";
import Cart from "@/features/cart/pages/Cart";
import Checkout from "@/features/checkout/pages/Checkout";
import PaymentSuccess from "@/features/checkout/pages/PaymentSuccess";
import PaymentFailure from "@/features/checkout/pages/PaymentFailure";
import PaymentCancel from "@/features/checkout/pages/PaymentCancel";
import Categories from "@/features/shop/pages/Categories";
import CategoryMedicines from "@/features/shop/pages/CategoryMedicines";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import DashboardHome from "@/features/dashboard/pages/DashboardHome";
import SellerHome from "@/features/dashboard/pages/SellerHome";
import AdminOverview from "@/features/dashboard/pages/AdminOverview";
import Orders from "@/features/dashboard/pages/Orders";
import OrderDetails from "@/features/dashboard/pages/OrderDetails";
import Payments from "@/features/dashboard/pages/Payments";
import Security from "@/features/dashboard/pages/Security";
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
          { path: PATHS.SHOP, element: <Shop /> },
          { path: PATHS.DEALS, element: <Deals /> },
          { path: PATHS.CART, element: <Cart /> },
          { path: PATHS.CATEGORIES, element: <Categories /> },
          { path: PATHS.CATEGORY_MEDICINES, element: <CategoryMedicines /> },
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
              { path: PATHS.FORGOT_PASSWORD, element: <ForgotPassword /> },
            ],
          },
        ],
      },

      // Checkout and Stripe return pages (storefront shell, sign-in required).
      {
        element: <PrivateRoute />,
        children: [
          {
            element: <PublicLayout />,
            children: [
              { path: PATHS.CHECKOUT, element: <Checkout /> },
              { path: PATHS.PAYMENT_SUCCESS, element: <PaymentSuccess /> },
              { path: PATHS.PAYMENT_FAILURE, element: <PaymentFailure /> },
              { path: PATHS.PAYMENT_CANCEL, element: <PaymentCancel /> },
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
              { path: PATHS.SECURITY, element: <Security /> },
              { path: PATHS.ORDERS, element: <Orders /> },
              { path: PATHS.ORDER_DETAILS(":id"), element: <OrderDetails /> },
              { path: PATHS.PAYMENTS, element: <Payments /> },
              {
                element: <RoleRoute allowedRoles={[ROLES.SELLER]} />,
                children: [{ path: PATHS.SELLER, element: <SellerHome /> }],
              },
              {
                element: <RoleRoute allowedRoles={[ROLES.ADMIN]} />,
                children: [
                  { path: PATHS.ADMIN, element: <AdminOverview /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
