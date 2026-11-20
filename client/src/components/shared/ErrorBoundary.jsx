import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Last-resort boundary for errors thrown outside React Router routes.
 * Route-level errors are handled by ErrorPage via `errorElement`.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught application error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Something went wrong</h1>
          <p className="mt-3 max-w-md text-muted">
            The application hit an unexpected error. Reloading usually fixes it.
          </p>
          <Button className="mt-8" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
