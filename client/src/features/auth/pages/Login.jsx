import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { notify } from "@/lib/notify";
import { PATHS } from "@/utils/paths";
import { useAuth } from "../hooks/useAuth";
import { loginSchema } from "../schemas/authSchemas";
import { getAuthErrorMessage } from "../utils/authErrors";
import { AuthField } from "../components/AuthField";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { FirebaseNotice } from "../components/FirebaseNotice";

function Login() {
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");
  const [pendingProvider, setPendingProvider] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const from = location.state?.from;
  const redirectTo = from
    ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
    : PATHS.DASHBOARD;

  const onSubmit = async (values) => {
    setFormError("");

    try {
      const user = await login(values);
      notify.success(`Welcome back, ${user.name}.`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      notify.error(message);
    }
  };

  const handleProvider = async (provider) => {
    setFormError("");
    setPendingProvider(provider);

    try {
      const user = await loginWithProvider(provider);
      notify.success(`Welcome, ${user.name}.`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      notify.error(message);
    } finally {
      setPendingProvider(null);
    }
  };

  const busy = isSubmitting || Boolean(pendingProvider);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to track orders, manage your profile, and shop trusted medicines.
        </p>
      </div>

      <FirebaseNotice />

      {formError ? (
        <p
          role="alert"
          className="rounded-control border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" className="w-full" disabled={busy}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <SocialAuthButtons
        onProvider={handleProvider}
        disabled={busy}
        pendingProvider={pendingProvider}
      />

      <p className="text-sm text-muted">
        No account?{" "}
        <Link to={PATHS.REGISTER} className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default Login;
