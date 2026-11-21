import { forwardRef, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/cn";

export function FieldError({ id, children }) {
  if (!children) return null;

  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-destructive">
      {children.message ?? children}
    </p>
  );
}

const inputClass =
  "h-11 w-full rounded-control border border-line bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/25 disabled:opacity-60";

export const FormField = forwardRef(function FormField(
  { label, name, error, icon: Icon, hint, className, ...inputProps },
  ref,
) {
  const id = inputProps.id ?? name;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          name={name}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass, Icon && "pl-10", error && "border-destructive")}
          {...inputProps}
        />
      </div>
      {!error && hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
});

export const PasswordField = forwardRef(function PasswordField(
  { label, name, error, className, ...inputProps },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const id = inputProps.id ?? name;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          id={id}
          name={name}
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass, "pr-11 pl-10", error && "border-destructive")}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-control text-muted transition hover:bg-hover hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
});
