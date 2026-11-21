import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { FormField, PasswordField } from "@/features/auth/components/FormFields";
import { AuthDivider, SocialButtons } from "@/features/auth/components/SocialButtons";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loginSchema } from "@/features/auth/schemas/authSchemas";
import { PATHS } from "@/utils/paths";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithGitHub, submitting } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectTo = location.state?.from?.pathname ?? PATHS.DASHBOARD;

  const onSubmit = async (values) => {
    const result = await login(values);

    if (result) navigate(redirectTo, { replace: true });
  };

  const onSocialLogin = async (provider) => {
    const result = await provider();

    if (result) navigate(redirectTo, { replace: true });
  };

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-1 text-sm text-muted">Sign in to continue to Medico.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          {...register("email")}
        />
        <PasswordField
          label="Password"
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password}
          {...register("password")}
        />
        <div className="-mt-2 text-right">
          <Link
            to={PATHS.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </Button>
      </form>

      <AuthDivider />

      <SocialButtons
        onGoogle={() => onSocialLogin(loginWithGoogle)}
        onGitHub={() => onSocialLogin(loginWithGitHub)}
        disabled={submitting}
      />

      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link to={PATHS.REGISTER} className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;
