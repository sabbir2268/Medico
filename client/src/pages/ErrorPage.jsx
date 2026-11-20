import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { cn } from "@/lib/cn";

function getErrorCopy(error) {
  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} ${error.statusText}`,
      message:
        typeof error.data === "string"
          ? error.data
          : "The requested page could not be loaded.",
    };
  }

  return {
    title: "Something went wrong",
    message:
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while loading this page.",
  };
}

export default function ErrorPage() {
  const error = useRouteError();
  const { title, message } = getErrorCopy(error);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-muted">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <Link to="/" className={cn(buttonVariants())}>
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
