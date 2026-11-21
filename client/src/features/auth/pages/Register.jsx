import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROLES } from "@/constants/roles";
import { notify } from "@/lib/notify";
import { PATHS } from "@/utils/paths";
import { useAuth } from "../hooks/useAuth";
import { registerSchema, safeRegisterDefaults } from "../schemas/authSchemas";
import { getAuthErrorMessage } from "../utils/authErrors";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "../constants";
import { AuthField, AuthSelect, fieldClassName } from "../components/AuthField";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { FirebaseNotice } from "../components/FirebaseNotice";
import { cn } from "@/lib/cn";

function Register() {
  const { register: registerUser, loginWithProvider, uploadAvatar } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [pendingProvider, setPendingProvider] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: safeRegisterDefaults,
    mode: "onTouched",
  });

  const onSubmit = async (values) => {
    setFormError("");

    try {
      const photoURL = avatarFile
        ? await uploadAvatar(avatarFile)
        : values.photoURL.trim();

      const user = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        photoURL,
        role: values.role,
      });

      notify.success(`Welcome to Medico, ${user.name}.`);
      navigate(PATHS.DASHBOARD, { replace: true });
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
      navigate(PATHS.DASHBOARD, { replace: true });
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
        <h1 className="text-2xl font-bold sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-muted">
          Join as a customer or seller. Admin access can only be granted by the Medico
          team.
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
          id="name"
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="Your display name"
          error={errors.name?.message}
          {...register("name")}
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthSelect
          id="role"
          label="I am a"
          error={errors.role?.message}
          {...register("role")}
        >
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role] ?? role}
            </option>
          ))}
        </AuthSelect>

        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use 8 or more characters."
          error={errors.password?.message}
          {...register("password")}
        />

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <AuthField
          id="photoURL"
          label="Profile photo URL (optional)"
          type="url"
          inputMode="url"
          placeholder="https://example.com/avatar.jpg"
          error={errors.photoURL?.message}
          {...register("photoURL")}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="avatarFile"
            className="block text-sm font-medium text-foreground"
          >
            Or upload a photo (optional)
          </label>
          <input
            id="avatarFile"
            type="file"
            accept="image/*"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            className={cn(
              fieldClassName,
              "file:mr-3 file:rounded-control file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary",
            )}
          />
          <p className="text-xs text-muted">
            PNG, JPG, or WebP up to 2 MB. Uploads use ImgBB; a URL works too.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <SocialAuthButtons
        onProvider={handleProvider}
        disabled={busy}
        pendingProvider={pendingProvider}
      />

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link to={PATHS.LOGIN} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-xs text-muted">
        Social sign-ups start with the {ROLE_LABELS[ROLES.CUSTOMER]} role. You can update
        your profile after signing in.
      </p>
    </div>
  );
}

export default Register;
