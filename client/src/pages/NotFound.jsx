import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { cn } from "@/lib/cn";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <SearchX className="h-12 w-12 text-primary" aria-hidden="true" />
      <p className="mt-6 text-sm font-semibold tracking-widest text-primary uppercase">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className={cn(buttonVariants(), "mt-8")}>
        <Home className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>
    </div>
  );
}
