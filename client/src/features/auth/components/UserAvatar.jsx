import { cn } from "@/lib/cn";

function getInitials(name) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "M"
  );
}

export function UserAvatar({ user, className }) {
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        className={cn(
          "h-10 w-10 shrink-0 rounded-full border border-line object-cover",
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary",
        className,
      )}
    >
      {getInitials(user?.name)}
    </span>
  );
}
