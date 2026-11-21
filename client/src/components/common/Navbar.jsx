import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Loader2, LogOut, Pill } from "lucide-react";
import { siteConfig } from "@/config/site";
import { UserAvatar } from "@/features/auth/components/UserAvatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getAuthErrorMessage } from "@/features/auth/utils/authErrors";
import { notify } from "@/lib/notify";
import { PATHS } from "@/utils/paths";

const linkClass = ({ isActive }) =>
  `rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-hover"
  }`;

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={PATHS.HOME}
          className="flex items-center gap-2 font-heading text-lg font-bold text-primary"
          aria-label={`${siteConfig.name} home`}
        >
          <Pill className="h-6 w-6" aria-hidden="true" />
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <NavLink to={PATHS.HOME} className={linkClass}>
              Home
            </NavLink>
            <NavLink to={PATHS.ABOUT} className={linkClass}>
              About
            </NavLink>
          </div>

          {user ? (
            <>
              <NavLink to={PATHS.DASHBOARD} className={linkClass}>
                Dashboard
              </NavLink>

              <Link
                to={PATHS.PROFILE}
                className="flex items-center gap-2 rounded-control px-2 py-1 transition-colors hover:bg-hover"
                aria-label="Open profile"
              >
                <UserAvatar user={user} className="h-8 w-8" />
                <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
                  {user.name}
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
            </>
          ) : (
            <>
              <NavLink to={PATHS.LOGIN} className={linkClass}>
                Login
              </NavLink>
              <NavLink to={PATHS.REGISTER} className={linkClass}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
