import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PATHS } from "@/utils/paths";
import { SectionHeading } from "./SectionHeading";
import { ProductCard } from "./ProductCard";
import { ProductGridSkeleton, SectionEmpty, SectionError } from "./HomeStates";

export function FeaturedMedicines({ query }) {
  return (
    <section
      id="featured"
      className="scroll-mt-24 space-y-6"
      aria-label="Featured medicines"
    >
      <SectionHeading
        eyebrow="Pharmacist picks"
        title="Featured medicines"
        description="Everyday health essentials selected for quality, value, and verified pharmacy support."
        action={
          <Link
            to={PATHS.SHOP}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Browse featured
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      {query.isLoading ? <ProductGridSkeleton count={8} /> : null}

      {!query.isLoading && query.isError ? (
        <SectionError
          title="Featured medicines could not be loaded"
          message="Showing pharmacist-selected essentials while the catalog reconnects."
          onRetry={query.refetch}
          isRetrying={query.isFetching}
        />
      ) : null}

      {!query.isLoading && query.items.length === 0 ? (
        <SectionEmpty
          title="No featured medicines yet"
          message="Our pharmacists are reviewing the next selection. Browse the full catalog for now."
          actionLabel="Shop all medicines"
          actionTo={PATHS.SHOP}
        />
      ) : null}

      {!query.isLoading && query.items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {query.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
