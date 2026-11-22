import { ArrowRight, BadgePercent } from "lucide-react";
import { Link } from "react-router-dom";
import { AsyncContent, SkeletonGrid } from "@/components/shared/AsyncContent";
import { MedicineCard } from "@/components/shared/MedicineCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatePanel } from "@/components/shared/StatePanel";
import { useDiscountedMedicines } from "@/features/home/hooks/useHomeData";
import { PATHS } from "@/utils/paths";

export default function Deals() {
  const query = useDiscountedMedicines();
  const items = query.items;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-teal-700 via-emerald-700 to-teal-900 px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase backdrop-blur">
            <BadgePercent className="h-3.5 w-3.5" aria-hidden="true" />
            Today&apos;s offers
          </span>
          <h1 className="mt-5 font-heading text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
            Save more on everyday care
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Discounts are calculated from trusted catalog prices. Stock and pricing are
            verified by the server before checkout.
          </p>
          <Link
            to={PATHS.SHOP}
            className="mt-7 inline-flex items-center gap-2 rounded-control bg-white px-5 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
          >
            Shop full catalog
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Limited-time prices"
          title="Discounted medicines"
          description="Handpicked savings from our verified pharmacy partners."
          isFallback={query.isFallback}
        />
        <AsyncContent
          query={query}
          skeleton={<SkeletonGrid count={8} />}
          empty={
            <StatePanel
              title="No deals right now"
              description="Our vendors are updating their offers. Check back soon."
              actionLabel="Browse medicines"
              onAction={query.refetch}
            />
          }
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))}
          </div>
        </AsyncContent>
      </section>
    </div>
  );
}
