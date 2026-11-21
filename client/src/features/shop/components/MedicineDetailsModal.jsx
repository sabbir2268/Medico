import { useEffect, useRef } from "react";
import { Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Visual } from "@/components/shared/Visual";
import { formatPrice } from "@/lib/format";

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2 last:border-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export function MedicineDetailsModal({ medicine, categoryName, onClose, onAddToCart }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const savings =
    Number(medicine.originalPrice) > Number(medicine.price)
      ? Number(medicine.originalPrice) - Number(medicine.price)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="medicine-details-title"
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-card border border-line bg-surface shadow-xl sm:rounded-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Medicine details
            </p>
            <h2
              id="medicine-details-title"
              className="mt-1 font-heading text-lg font-bold sm:text-xl"
            >
              {medicine.name}
            </h2>
          </div>
          <Button
            ref={closeRef}
            size="icon"
            variant="outline"
            onClick={onClose}
            aria-label="Close medicine details"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <Visual
              name={medicine.visual}
              tone={medicine.tone}
              className="aspect-square w-full"
              iconClassName="h-20 w-20"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {medicine.prescriptionRequired && (
                <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white">
                  Prescription required
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  medicine.inStock === false
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/10 text-success"
                }`}
              >
                {medicine.inStock === false ? "Out of stock" : "In stock"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm leading-relaxed text-muted">
              {medicine.description ??
                `${medicine.genericName ?? "Medicine"} in ${medicine.form ?? "pharmacy"} form, supplied by ${medicine.vendor ?? "a verified vendor"}.`}
            </p>

            <dl className="mt-4">
              <Detail label="Generic name" value={medicine.genericName} />
              <Detail label="Company" value={medicine.company ?? medicine.manufacturer} />
              <Detail label="Category" value={categoryName} />
              <Detail label="Strength" value={medicine.strength} />
              <Detail label="Form" value={medicine.form} />
              <Detail label="Vendor" value={medicine.vendor} />
              <Detail
                label="Rating"
                value={
                  medicine.rating ? (
                    <span className="inline-flex items-center gap-1">
                      <Star
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                      {medicine.rating} ({medicine.reviewCount ?? 0})
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>

            <div className="mt-5 rounded-card border border-line bg-background p-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">
                  {formatPrice(medicine.price)}
                </span>
                {savings > 0 && (
                  <>
                    <span className="text-sm text-muted line-through">
                      {formatPrice(medicine.originalPrice)}
                    </span>
                    <span className="text-xs font-semibold text-success">
                      Save {formatPrice(savings)}
                    </span>
                  </>
                )}
              </div>
              <Button
                className="mt-4 w-full"
                disabled={medicine.inStock === false}
                onClick={() => onAddToCart(medicine)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add to cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
