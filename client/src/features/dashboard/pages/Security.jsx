import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/features/auth/components/FormFields";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { passwordSchema } from "@/features/auth/schemas/authSchemas";

export default function Security() {
  const { changePassword, submitting } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values) => {
    const result = await changePassword(values);

    if (result) reset();
  };

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Your account</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Security</h1>
        <p className="mt-2 text-sm text-muted">Keep your password strong and up to date.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-card border border-line bg-surface p-6 shadow-card"
        noValidate
      >
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
          Change password
        </h2>
        <p className="mt-1 text-sm text-muted">
          Available for email-based accounts. Social accounts use their provider.
        </p>
        <div className="mt-5 space-y-4">
          <PasswordField
            label="Current password"
            name="currentPassword"
            autoComplete="current-password"
            error={errors.currentPassword}
            {...register("currentPassword")}
          />
          <PasswordField
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            error={errors.newPassword}
            {...register("newPassword")}
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            error={errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </div>
        <Button type="submit" className="mt-6" disabled={submitting}>
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>

      <div className="flex items-start gap-3 rounded-card border border-line bg-surface p-5 text-sm text-muted shadow-card">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p>
          Never share your password. Admin roles are assigned by Medico staff and cannot be
          requested from the profile page.
        </p>
      </div>
    </section>
  );
}
