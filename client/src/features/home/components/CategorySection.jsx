import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AsyncContent, SkeletonGrid } from "@/components/shared/AsyncContent";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Visual } from "@/components/shared/Visual";
import { PATHS } from "@/utils/paths";
import { useCategories } from "../hooks/useHomeData";

function CategoryCard({ category }) {
  return (
    <Link
      to={PATHS.CATEGORY(category.id)}
      className="group flex h-full flex-col rounded-card border border-line bg-surface p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      <Visual
        name={category.icon}
        tone={category.tone}
        className="aspect-[5/3] w-full transition-transform duration-300 group-hover:scale-[1.02]"
        iconClassName="h-12 w-12"
      />
      <div className="mt-4 flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm leading-snug font-semibold text-foreground sm:text-base">
          {category.name}
        </h3>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-muted transition group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
        {category.description}
      </p>
      <p className="mt-auto pt-4 text-xs font-semibold text-primary">
        {category.productCount?.toLocaleString() ?? "Many"} products
      </p>
    </Link>
  );
}

const VISIBLE_CATEGORIES = 8;

export function CategorySection() {
  const query = useCategories();
  const categories = query.items.slice(0, VISIBLE_CATEGORIES);

  return (
    <section id="categories" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Browse by category"
        title="Find exactly what you need"
        description="From everyday pain relief to long-term prescriptions, explore carefully organized shelves from every verified vendor on Medico."
        isFallback={query.isFallback}
      />
      <AsyncContent
        query={query}
        skeleton={<SkeletonGrid count={8} />}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      >
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </AsyncContent>
      {!query.isPending && !query.isError && query.items.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Link
            to={PATHS.CATEGORIES}
            className="inline-flex items-center gap-2 rounded-control border border-primary/30 bg-primary-soft/60 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            Show more categories
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
