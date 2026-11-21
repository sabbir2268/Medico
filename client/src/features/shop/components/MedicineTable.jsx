import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MedicineCard } from "@/components/shared/MedicineCard";
import { Visual } from "@/components/shared/Visual";
import { formatPrice } from "@/lib/format";

function categoryNameFor(medicine, categories) {
  const id = medicine.categoryId ?? medicine.category?.id ?? medicine.category?._id;
  const match = categories.find((category) => category.id === id || category._id === id);

  if (match) return match.name;
  if (medicine.category?.name) return medicine.category.name;
  if (medicine.categoryName) return medicine.categoryName;
  if (typeof medicine.category === "string") return medicine.category;

  return "Uncategorized";
}

function MedicineThumb({ medicine }) {
  const src = medicine.image ?? medicine.photoURL;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className="h-14 w-14 rounded-control border border-line object-cover"
      />
    );
  }

  return (
    <Visual
      name={medicine.visual}
      tone={medicine.tone}
      className="h-14 w-14 border-0"
      iconClassName="h-6 w-6"
    />
  );
}

export function MedicineTable({ medicines, categories = [], onDetails, onAddToCart }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line">
              {["Image", "Medicine", "Company", "Category", "Price", "Actions"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {medicines.map((medicine) => (
              <tr
                key={medicine.id ?? medicine._id}
                className="border-b border-line last:border-0 hover:bg-hover/50"
              >
                <td className="px-4 py-3">
                  <MedicineThumb medicine={medicine} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{medicine.name}</p>
                    {medicine.prescriptionRequired && (
                      <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Rx
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {medicine.genericName}
                    {medicine.strength ? ` · ${medicine.strength}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {medicine.inStock === false ? (
                      <span className="font-medium text-destructive">Out of stock</span>
                    ) : (
                      <span className="font-medium text-success">In stock</span>
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {medicine.company ?? medicine.manufacturer ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {categoryNameFor(medicine, categories)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-heading font-bold text-foreground">
                      {formatPrice(medicine.price)}
                    </span>
                    {Number(medicine.originalPrice) > Number(medicine.price) && (
                      <span className="text-xs text-muted line-through">
                        {formatPrice(medicine.originalPrice)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onDetails(medicine)}
                      aria-label={`View details for ${medicine.name}`}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      disabled={medicine.inStock === false}
                      onClick={() => onAddToCart(medicine)}
                      aria-label={`Add ${medicine.name} to cart`}
                      title="Add to cart"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 md:hidden">
        {medicines.map((medicine) => (
          <MedicineCard
            key={medicine.id ?? medicine._id}
            medicine={medicine}
            onDetails={() => onDetails(medicine)}
          />
        ))}
      </div>
    </>
  );
}
