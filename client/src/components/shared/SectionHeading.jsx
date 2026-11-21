import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  isFallback = false,
  centered = false,
  className,
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10",
        centered ? "text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && (
          <div
            className={cn(
              "mb-3 flex items-center gap-2",
              centered ? "justify-center" : "justify-start",
            )}
          >
            <span className="rounded-full border border-primary/20 bg-primary-soft/60 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
              {eyebrow}
            </span>
            {isFallback && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted"
                title="Live endpoints are unavailable, showing the curated catalog"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                Demo catalog
              </span>
            )}
          </div>
        )}
        <h2 className="font-heading text-2xl leading-tight font-bold text-foreground sm:text-3xl lg:text-[2rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className={cn(centered && "flex justify-center")}>{action}</div>}
    </div>
  );
}
