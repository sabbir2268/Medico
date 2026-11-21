import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/cn";
import { PATHS } from "@/utils/paths";
import { useAuth } from "../hooks/useAuth";
import { profileSchema } from "../schemas/authSchemas";
import { getAuthErrorMessage } from "../utils/authErrors";
import { ROLE_LABELS } from "../constants";
import { AuthField, fieldClassName } from "../components/AuthField";
import { UserAvatar } from "../components/UserAvatar";

export default function Profile() {
  const { user, updateProfile, uploadAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      photoURL: user?.photoURL ?? "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    reset({
      name: user?.name ?? "",
      photoURL: user?.photoURL ?? "",
    });
  }, [user, reset]);

  useEffect(() => {
    if (!filePreview) {
      return undefined;
    }

    return () => URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    setFilePreview(file ? URL.createObjectURL(file) : null);
  };

  const watchedPhotoURL = useWatch({ control, name: "photoURL" });
  const previewUser = {
    ...user,
    photoURL: filePreview ?? (watchedPhotoURL?.trim() || user?.photoURL),
  };

  const onSubmit = async (values) => {
    setFormError("");

    try {
      const photoURL = avatarFile
        ? await uploadAvatar(avatarFile)
        : values.photoURL.trim();

      await updateProfile({ name: values.name, photoURL });
      setAvatarFile(null);
      setFilePreview(null);
      notify.success("Profile updated.");
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      notify.error(message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      notify.success("You have been signed out.");
      navigate(PATHS.HOME, { replace: true });
    } catch (error) {
      notify.error(getAuthErrorMessage(error));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Profile</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Manage the name and photo shown across Medico.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {formError ? (
              <p
                role="alert"
                className="rounded-control border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            ) : null}

            <AuthField
              id="profile-name"
              label="Username"
              type="text"
              autoComplete="username"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="profile-email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className={fieldClassName}
              />
              <p className="text-xs text-muted">
                Email changes are handled by your sign-in provider.
              </p>
            </div>

            <AuthField
              id="profile-photo-url"
              label="Photo URL"
              type="url"
              inputMode="url"
              placeholder="https://example.com/avatar.jpg"
              error={errors.photoURL?.message}
              {...register("photoURL")}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="profile-avatar"
                className="block text-sm font-medium text-foreground"
              >
                Upload a new photo
              </label>
              <input
                id="profile-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className={cn(
                  fieldClassName,
                  "file:mr-3 file:rounded-control file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary",
                )}
              />
              <p className="text-xs text-muted">
                PNG, JPG, or WebP up to 2 MB. The uploaded URL is saved to your profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={isSubmitting}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </div>
          </form>
        </div>

        <aside className="h-fit rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="flex items-center gap-3">
            <UserAvatar user={previewUser} className="h-14 w-14 text-base" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user?.name}</p>
              <p className="truncate text-sm text-muted">{user?.email}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Role</span>
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {ROLE_LABELS[user?.role] ?? "User"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Email verified</span>
              <span className="font-medium">{user?.emailVerified ? "Yes" : "No"}</span>
            </div>
          </div>

          <p className="mt-5 text-xs text-muted">
            Role changes are managed by the Medico team. You cannot grant yourself admin
            access.
          </p>
        </aside>
      </div>
    </section>
  );
}
