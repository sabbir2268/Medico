import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  Pill,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { ROLES } from "@/constants/roles";
import { UserAvatar } from "@/features/auth/components/UserAvatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_LABELS } from "@/features/auth/constants";
import { getAuthErrorMessage } from "@/features/auth/utils/authErrors";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/notify";
import { PATHS } from "@/utils/paths";

function navLinkClass({ isActive }) {
  return cn(
    "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted hover:bg-hover hover:text-foreground",
  );
}

function mobileNavLinkClass({ isActive }) {
  return cn(
    "flex items-center gap-2 whitespace-nowrap rounded-control px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted hover:bg-hover hover:text-foreground",
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const dashboardNav = [
    {
      label: "Overview",
      to: PATHS.DASHBOARD,
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: "Profile",
      to: PATHS.PROFILE,
      icon: UserRound,
    },
    ...(user?.role === ROLES.VENDOR
      ? [{ label: "Seller", to: PATHS.SELLER, icon: ShoppingBag }]
      : []),
  ];

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      notify.success("You have been signed out.");
      navigate(PATHS.HOME, { replace: true });
    } catch (error) {
      notify.error(getAuthErrorMessage(error));
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Link
            to={PATHS.DASHBOARD}
            className="flex items-center gap-2 font-heading text-lg font-bold text-primary"
            aria-label={`${siteConfig.name} dashboard`}
          >
            <Pill className="h-6 w-6" aria-hidden="true" />
            {siteConfig.name}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Dashboard">
          {dashboardNav.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-line p-4">
          <Link
            to={PATHS.PROFILE}
            className="flex items-center gap-3 rounded-control p-2 transition-colors hover:bg-hover"
          >
            <UserAvatar user={user} className="h-9 w-9" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user?.name}</span>
              <span className="block truncate text-xs text-muted">
                {ROLE_LABELS[user?.role] ?? "User"}
              </span>
            </span>
          </Link>

          <Link
            to={PATHS.HOME}
            className="flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-foreground"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            Back to store
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-foreground disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to={PATHS.DASHBOARD}
              className="flex items-center gap-2 font-heading text-lg font-bold text-primary lg:hidden"
              aria-label={`${siteConfig.name} dashboard`}
            >
              <Pill className="h-6 w-6" aria-hidden="true" />
              {siteConfig.name}
            </Link>
            <span className="hidden text-sm font-medium text-muted lg:block">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={PATHS.PROFILE}
              className="flex items-center gap-2 rounded-control p-1 pr-2 transition-colors hover:bg-hover"
              aria-label="Open profile"
            >
              <UserAvatar user={user} className="h-8 w-8" />
              <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                {user?.name}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-hover hover:text-foreground disabled:opacity-60"
              aria-label="Sign out"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-4 py-2 lg:hidden"
          aria-label="Dashboard mobile navigation"
        >
          {dashboardNav.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={mobileNavLinkClass}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
          <Link
            to={PATHS.HOME}
            className="flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:bg-hover hover:text-foreground"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            Store
          </Link>
        </nav>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
