import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AsyncContent, SkeletonGrid } from "@/components/shared/AsyncContent";
import { Visual } from "@/components/shared/Visual";
import { useCategories } from "@/features/home/hooks/useHomeData";
import { PATHS } from "@/utils/paths";

export default function Categories() {
  const query = useCategories();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-primary">Browse the catalog</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Medicine categories</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Choose a category to see its medicines with search, price sorting, and
          pagination.
        </p>
      </div>

      <AsyncContent
        query={query}
        skeleton={<SkeletonGrid count={8} />}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      >
        {query.items.map((category) => (
          <Link
            key={category.id}
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
              <h2 className="font-heading text-sm leading-snug font-semibold sm:text-base">
                {category.name}
              </h2>
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
        ))}
      </AsyncContent>
    </div>
  );
}
