import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AsyncContent, SkeletonGrid } from "@/components/shared/AsyncContent";
import { MedicineCard } from "@/components/shared/MedicineCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PATHS } from "@/utils/paths";
import { useFeaturedMedicines } from "../hooks/useHomeData";

export function FeaturedSection() {
  const query = useFeaturedMedicines();

  return (
    <section id="featured-medicines" className="scroll-mt-24">
      <div id="medicines" className="scroll-mt-24" />
      <SectionHeading
        eyebrow="Featured medicines"
        title="Trusted picks from our pharmacy partners"
        description="Hand-selected essentials with strong ratings, clear pricing, and full manufacturer details — so you can order with confidence."
        isFallback={query.isFallback}
        action={
          <Link
            to={PATHS.SHOP}
            className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
          >
            See today's deals
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
      <AsyncContent
        query={query}
        skeleton={<SkeletonGrid count={8} />}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      >
        {query.items.map((medicine) => (
          <MedicineCard key={medicine.id} medicine={medicine} />
        ))}
      </AsyncContent>
    </section>
  );
}
