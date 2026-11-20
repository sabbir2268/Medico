import { Link, Outlet } from "react-router-dom";
import { Pill } from "lucide-react";
import { siteConfig } from "@/config/site";
import { PATHS } from "@/utils/paths";

const AuthLayout = () => {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to={PATHS.HOME}
            className="flex items-center gap-2 font-heading text-lg font-bold text-primary"
            aria-label={`${siteConfig.name} home`}
          >
            <Pill className="h-6 w-6" aria-hidden="true" />
            {siteConfig.name}
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
