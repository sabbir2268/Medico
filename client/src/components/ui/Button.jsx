import { buttonVariants } from "./buttonVariants";
import { cn } from "@/lib/cn";

/**
 * Primary button primitive. Defaults to type="button" so it never submits a
 * form by accident; pass type="submit" explicitly where needed.
 */
export function Button({ variant, size, className, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
