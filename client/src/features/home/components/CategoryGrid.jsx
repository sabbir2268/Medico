import { Link } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  Droplets,
  HeartPulse,
  Pill,
  Salad,
  Sparkles,
  Syringe,
  Thermometer,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PATHS } from "@/utils/paths";
import { SectionHeading } from "./SectionHeading";
import { CategoryGridSkeleton, SectionEmpty, SectionError } from "./HomeStates";
import { formatCount } from "../utils/format";

const ICONS = {
  Baby,
  Droplets,
  HeartPulse,
  Pill,
  Salad,
  Sparkles,
  Syringe,
  Thermometer,
  Wind,
};

const TONES = {
  teal: "bg-primary-soft text-primary",
  emerald: "bg-secondary text-secondary-foreground",
  amber: "bg-warning/10 text-warning",
  rose: "bg-destructive/10 text-destructive",
  sky: "bg-info/10 text-info",
  violet: "bg-purple-500/10 text-purple-600",
};

export function CategoryGrid({ query }) {
  const categories = query.items;

  return (
    <section
      id="categories"
      className="scroll-mt-24 space-y-6"
      aria-label="Medicine categories"
    >
      <SectionHeading
        eyebrow="Shop by need"
        title="Find the right care, faster"
        description="Browse pharmacist-curated categories from verified vendors across the Medico marketplace."
        action={
          <Link
            to={PATHS.SHOP}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View all categories
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
      {query.isLoading ? <CategoryGridSkeleton /> : null}

      {!query.isLoading && query.isError ? (
        <SectionError
          title="Categories could not be loaded"
          message="Showing our core health categories while the catalog reconnects."
          onRetry={query.refetch}
          isRetrying={query.isFetching}
        />
      ) : null}

      {!query.isLoading && categories.length === 0 ? (
        <SectionEmpty
          title="No categories yet"
          message="The pharmacy team is still organising the catalog. Please check back soon."
          actionLabel="Browse all medicines"
          actionTo={PATHS.SHOP}
        />
      ) : null}

      {!query.isLoading && categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = ICONS[category.icon] ?? Pill;
            const tone = TONES[category.tone] ?? TONES.teal;

            return (
              <Link
                key={category.id}
                to={`${PATHS.SHOP}?category=${encodeURIComponent(category.slug)}`}
                className="group rounded-card border border-line bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-control",
                      tone,
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ArrowRight
                    className="mt-1 h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-semibold">{category.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {category.description}
                </p>
                <p className="mt-4 text-xs font-medium text-primary">
                  {formatCount(category.productCount)} products
                </p>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
