import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PATHS } from "@/utils/paths";
import { SectionHeading } from "./SectionHeading";
import { ProductSlider } from "./ProductSlider";
import { ProductGridSkeleton, SectionEmpty, SectionError } from "./HomeStates";

export function DiscountedMedicines({ query }) {
  return (
    <section id="deals" className="scroll-mt-24 space-y-6" aria-label="Discounted medicines">
      <SectionHeading
        eyebrow="Weekly savings"
        title="Discounted medicines"
        description="Limited-time prices on everyday essentials, reviewed by licensed pharmacies."
        action={
          <Link
            to={`${PATHS.SHOP}?sort=discount`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View all deals
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      {query.isLoading ? <ProductGridSkeleton count={4} /> : null}

      {!query.isLoading && query.isError ? (
        <SectionError
          title="Deals could not be loaded"
          message="Showing a curated selection of current offers while the catalog reconnects."
          onRetry={query.refetch}
          isRetrying={query.isFetching}
        />
      ) : null}

      {!query.isLoading && query.items.length === 0 ? (
        <SectionEmpty
          title="No discounted medicines right now"
          message="New weekly offers are added regularly. Explore the full catalog in the meantime."
          actionLabel="Shop all medicines"
          actionTo={PATHS.SHOP}
        />
      ) : null}

      {!query.isLoading && query.items.length > 0 ? (
        <ProductSlider products={query.items} />
      ) : null}
    </section>
  );
}
