import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { ImagePlus, LogOut, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, PasswordField } from "@/features/auth/components/FormFields";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { passwordSchema, profileSchema } from "@/features/auth/schemas/authSchemas";
import { notify } from "@/lib/notify";
import { PATHS } from "@/utils/paths";

function Profile() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const { user, updateProfile, changePassword, uploadPhoto, logout, submitting } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
      photoURL: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      country: "Bangladesh",
    },
  });
  const {
    register: registerPassword,
    handleSubmit: submitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const photoURL = useWatch({ control, name: "photoURL" });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username ?? user.name ?? "",
        email: user.email ?? "",
        photoURL: user.photoURL ?? "",
        phone: user.phone ?? "",
        addressLine1: user.address?.addressLine1 ?? "",
        addressLine2: user.address?.addressLine2 ?? "",
        city: user.address?.city ?? "",
        postalCode: user.address?.postalCode ?? "",
        country: user.address?.country ?? "Bangladesh",
      });
    }
  }, [user, reset]);

  const onProfileSubmit = async (values) => {
    const result = await updateProfile(values);

    if (result) reset(values);
  };

  const onPasswordSubmit = async (values) => {
    const result = await changePassword(values);

    if (result) resetPassword();
  };

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";
    if (!file) return;

    const url = await uploadPhoto(file);

    if (url) {
      setValue("photoURL", url, { shouldDirty: true, shouldValidate: true });
      notify.success("Profile photo uploaded.");
    }
  };

  const onLogout = async () => {
    await logout();
    navigate(PATHS.HOME, { replace: true });
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">My profile</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Keep your contact details, photo, and password up to date.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <form
            onSubmit={handleSubmit(onProfileSubmit)}
            className="rounded-card border border-line bg-surface p-6 shadow-card"
            noValidate
          >
            <h2 className="text-lg font-semibold">Profile information</h2>
            <div className="mt-5 space-y-4">
              <FormField
                label="Username"
                name="username"
                autoComplete="username"
                error={errors.username}
                {...register("username")}
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                error={errors.email}
                {...register("email")}
              />
              <FormField
                label="Photo URL"
                name="photoURL"
                type="url"
                placeholder="https://example.com/photo.jpg"
                icon={ImagePlus}
                error={errors.photoURL}
                {...register("photoURL")}
              />

              <FormField
                label="Phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                error={errors.phone}
                {...register("phone")}
              />

              <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField
                    label="Address line 1"
                    name="addressLine1"
                    autoComplete="address-line1"
                    error={errors.addressLine1}
                    {...register("addressLine1")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FormField
                    label="Address line 2"
                    name="addressLine2"
                    autoComplete="address-line2"
                    error={errors.addressLine2}
                    {...register("addressLine2")}
                  />
                </div>
                <FormField
                  label="City"
                  name="city"
                  autoComplete="address-level2"
                  error={errors.city}
                  {...register("city")}
                />
                <FormField
                  label="Postal code"
                  name="postalCode"
                  autoComplete="postal-code"
                  error={errors.postalCode}
                  {...register("postalCode")}
                />
                <FormField
                  label="Country"
                  name="country"
                  autoComplete="country-name"
                  error={errors.country}
                  {...register("country")}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {photoURL && (
                  <img
                    src={photoURL}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full border border-line object-cover"
                  />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onPhotoChange}
                  aria-label="Upload profile photo"
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload photo
                </Button>
                <span className="text-xs text-muted">Images up to 2 MB.</span>
              </div>
            </div>
            <Button type="submit" className="mt-6" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </form>

          <form
            onSubmit={submitPassword(onPasswordSubmit)}
            className="rounded-card border border-line bg-surface p-6 shadow-card"
            noValidate
          >
            <h2 className="text-lg font-semibold">Change password</h2>
            <p className="mt-1 text-sm text-muted">
              Available for email-based accounts. Social accounts use their provider.
            </p>
            <div className="mt-5 space-y-4">
              <PasswordField
                label="Current password"
                name="currentPassword"
                autoComplete="current-password"
                error={passwordErrors.currentPassword}
                {...registerPassword("currentPassword")}
              />
              <PasswordField
                label="New password"
                name="newPassword"
                autoComplete="new-password"
                error={passwordErrors.newPassword}
                {...registerPassword("newPassword")}
              />
              <PasswordField
                label="Confirm new password"
                name="confirmPassword"
                autoComplete="new-password"
                error={passwordErrors.confirmPassword}
                {...registerPassword("confirmPassword")}
              />
            </div>
            <Button type="submit" variant="outline" className="mt-6" disabled={submitting}>
              {submitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold">Account details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Role</dt>
                <dd className="font-medium capitalize">{user?.role ?? "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Sign-in method</dt>
                <dd className="font-medium capitalize">
                  {user?.provider?.replace("password", "email") ?? "-"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Email verified</dt>
                <dd className="font-medium">{user?.emailVerified ? "Yes" : "No"}</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 rounded-control bg-secondary p-3 text-xs text-secondary-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Admin access is assigned by Medico staff and cannot be requested here.
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold">Session</h2>
            <p className="mt-1 text-sm text-muted">Sign out of this device.</p>
            <Button variant="danger" className="mt-4 w-full" onClick={onLogout} disabled={submitting}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Profile;
