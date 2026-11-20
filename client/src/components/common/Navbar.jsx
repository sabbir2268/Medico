import { Link, NavLink } from "react-router-dom";
import { Pill } from "lucide-react";
import { siteConfig } from "@/config/site";
import { PATHS } from "@/utils/paths";

const linkClass = ({ isActive }) =>
  `rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-hover"
  }`;

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={PATHS.HOME}
          className="flex items-center gap-2 font-heading text-lg font-bold text-primary"
          aria-label={`${siteConfig.name} home`}
        >
          <Pill className="h-6 w-6" aria-hidden="true" />
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink to={PATHS.HOME} className={linkClass}>
            Home
          </NavLink>
          <NavLink to={PATHS.ABOUT} className={linkClass}>
            About
          </NavLink>

          <NavLink to={PATHS.LOGIN} className={linkClass}>
            Login
          </NavLink>
          <NavLink to={PATHS.REGISTER} className={linkClass}>
            Register
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
