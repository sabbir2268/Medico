import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/features/auth/components/FormFields";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { resetPasswordSchema } from "@/features/auth/schemas/authSchemas";
import { PATHS } from "@/utils/paths";

function ForgotPassword() {
  const { resetPassword, submitting } = useAuth();
  const [sentTo, setSentTo] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    const result = await resetPassword(email);

    if (result) setSentTo(email);
  };

  if (sentTo) {
    return (
      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <span className="flex h-11 w-11 items-center justify-center rounded-control bg-primary-soft text-primary">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
        <p className="mt-1 text-sm text-muted">
          We sent a password reset link to{" "}
          <span className="font-medium text-foreground">{sentTo}</span>. Follow the link
          in that email to choose a new password.
        </p>
        <p className="mt-3 text-xs text-muted">
          The link expires after a while. If it does not arrive, check your spam folder or
          try again.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to={PATHS.LOGIN}
            className="inline-flex h-11 w-full items-center justify-center rounded-control bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Back to login
          </Link>
          <Button variant="ghost" className="w-full" onClick={() => setSentTo("")}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-bold">Forgot password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the email you use for Medico and we will send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          icon={Mail}
          error={errors.email}
          {...register("email")}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Sending link..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link
          to={PATHS.LOGIN}
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default ForgotPassword;
