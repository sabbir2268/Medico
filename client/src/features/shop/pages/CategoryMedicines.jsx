import { Link, useNavigate, useParams } from "react-router-dom";
import { StatePanel } from "@/components/shared/StatePanel";
import { useCategories } from "@/features/home/hooks/useHomeData";
import { PATHS } from "@/utils/paths";
import { CatalogPanel } from "../components/CatalogPanel";

export default function CategoryMedicines() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const categoriesQuery = useCategories();
  const category = categoriesQuery.items.find(
    (item) => item.id === categoryId || item._id === categoryId,
  );

  if (categoriesQuery.isPending) {
    return (
      <StatePanel
        variant="empty"
        title="Loading category"
        description="Fetching the category details from the pharmacy catalog."
      />
    );
  }

  if (!category) {
    return (
      <StatePanel
        variant="error"
        title="Category not found"
        description="That category is not available. Browse all categories to find another one."
        actionLabel="Browse categories"
        onAction={() => navigate(PATHS.CATEGORIES)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-muted"
      >
        <Link to={PATHS.HOME} className="hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={PATHS.CATEGORIES} className="hover:text-primary">
          Categories
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">{category.name}</span>
      </nav>

      <div>
        <p className="text-sm font-semibold text-primary">Category collection</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{category.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {category.description ?? "Explore verified medicines in this category."}
        </p>
      </div>

      <CatalogPanel
        lockedCategoryId={categoryId}
        categoryName={category.name}
        emptyDescription={`No medicines in ${category.name} match your search. Try another term or clear the filters.`}
      />
    </div>
  );
}
