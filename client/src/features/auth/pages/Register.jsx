import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, PasswordField } from "@/features/auth/components/FormFields";
import { RoleSelector } from "@/features/auth/components/RoleSelector";
import { AuthDivider, SocialButtons } from "@/features/auth/components/SocialButtons";
import { ROLES } from "@/constants/roles";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { registerSchema } from "@/features/auth/schemas/authSchemas";
import { PATHS } from "@/utils/paths";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle, loginWithGitHub, submitting, error } = useAuth();
  const {
    register: formRegister,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      photoURL: "",
      password: "",
      confirmPassword: "",
      role: ROLES.USER,
    },
  });

  const redirectTo = location.state?.from?.pathname ?? PATHS.DASHBOARD;

  const onSubmit = async (values) => {
    const result = await register(values);

    // Registration does not sign the user in; send them to the login page.
    // Keep the original "from" location so login can still honor it later.
    if (result)
      navigate(PATHS.LOGIN, {
        replace: true,
        state: { ...location.state, registeredEmail: values.email },
      });
  };

  const onSocialLogin = async (provider) => {
    const result = await provider();

    if (result) navigate(redirectTo, { replace: true });
  };

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <p className="mt-1 text-sm text-muted">Choose how you want to use Medico.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        {error && (
          <p
            role="alert"
            className="rounded-control border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error.errors?.email ?? error.errors?.username ?? error.message}
          </p>
        )}
        <FormField
          label="Username"
          name="username"
          placeholder="Your name"
          autoComplete="username"
          error={errors.username}
          {...formRegister("username")}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          {...formRegister("email")}
        />
        <FormField
          label="Photo URL"
          name="photoURL"
          type="url"
          placeholder="https://example.com/photo.jpg"
          icon={ImagePlus}
          hint="Optional. You can upload a photo later from your profile."
          error={errors.photoURL}
          {...formRegister("photoURL")}
        />
        <PasswordField
          label="Password"
          name="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password}
          {...formRegister("password")}
        />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...formRegister("confirmPassword")}
        />
        <RoleSelector control={control} error={errors.role} />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </Button>
      </form>

      <AuthDivider />

      <SocialButtons
        onGoogle={() => onSocialLogin(loginWithGoogle)}
        onGitHub={() => onSocialLogin(loginWithGitHub)}
        disabled={submitting}
      />

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to={PATHS.LOGIN} className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}

export default Register;
