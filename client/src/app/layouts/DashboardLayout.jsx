import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Pill, Store, UserRound } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ROLES } from "@/constants/roles";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/cn";
import { PATHS } from "@/utils/paths";

const dashboardNav = [
  {
    label: "Overview",
    to: PATHS.DASHBOARD,
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "My profile",
    to: PATHS.PROFILE,
    icon: UserRound,
  },
];

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
  const navigate = useNavigate();
  const { user, logout, submitting } = useAuth();
  const navItems =
    user?.role === ROLES.SELLER
      ? [...dashboardNav, { label: "Seller tools", to: PATHS.SELLER, icon: Store }]
      : dashboardNav;

  const onLogout = async () => {
    await logout();
    navigate(PATHS.HOME, { replace: true });
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
          {navItems.map((item) => {
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
            to={PATHS.HOME}
            className="flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-foreground"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            Back to store
          </Link>
          <button
            type="button"
            onClick={onLogout}
            disabled={submitting}
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
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

          <Link
            to={PATHS.HOME}
            className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-foreground"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to store</span>
          </Link>
        </header>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-4 py-2 lg:hidden"
          aria-label="Dashboard mobile navigation"
        >
          {navItems.map((item) => {
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
