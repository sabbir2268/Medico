import { useController } from "react-hook-form";
import { Store, UserRound } from "lucide-react";
import { ASSIGNABLE_ROLES } from "@/constants/roles";
import { cn } from "@/lib/cn";
import { FieldError } from "./FormFields";

const ICONS = { user: UserRound, seller: Store };

export function RoleSelector({ control, name = "role", error }) {
  const { field } = useController({ control, name, defaultValue: "user" });

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">Account type</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {ASSIGNABLE_ROLES.map((role) => {
          const Icon = ICONS[role.value] ?? UserRound;
          const selected = field.value === role.value;

          return (
            <label
              key={role.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-card border p-3 transition",
                selected
                  ? "border-primary bg-primary-soft/50 ring-1 ring-primary"
                  : "border-line bg-surface hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name={field.name}
                value={role.value}
                checked={selected}
                onChange={() => field.onChange(role.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-control",
                  selected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{role.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {role.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        Admin accounts are assigned by Medico staff and cannot be selected here.
      </p>
      <FieldError id="role-error">{error}</FieldError>
    </fieldset>
  );
}
