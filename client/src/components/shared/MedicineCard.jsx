import { Eye, Plus, Star, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Visual } from "@/components/shared/Visual";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { notify } from "@/lib/notify";
import { useCart } from "@/features/cart/hooks/useCart";

function Rating({ rating, reviewCount }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              "h-3.5 w-3.5",
              index < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted/30 text-muted/40",
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="font-semibold text-foreground">{rating}</span>
      <span className="text-muted">({reviewCount})</span>
    </div>
  );
}

export function MedicineCard({ medicine, className, onDetails }) {
  const { add } = useCart();
  const {
    name,
    genericName,
    strength,
    form,
    vendor,
    price,
    originalPrice,
    discountPercent,
    rating,
    reviewCount,
    prescriptionRequired,
    inStock,
    badge,
    visual,
    tone,
  } = medicine;

  const savings =
    Number(originalPrice) > Number(price) ? Number(originalPrice) - Number(price) : 0;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative p-3 pb-0">
        <Visual
          name={visual}
          tone={tone}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute top-5 left-5 flex flex-col items-start gap-1.5">
          {badge && (
            <span className="rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm backdrop-blur">
              {badge}
            </span>
          )}
          {prescriptionRequired && (
            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              Rx
            </span>
          )}
        </div>
        {discountPercent > 0 && (
          <span className="absolute top-5 right-5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
            -{discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 pt-4">
        <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
          {form}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-heading text-sm leading-snug font-semibold text-foreground sm:text-base">
          {name}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted">
          {genericName} · {strength}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
          <span className="flex min-w-0 items-center gap-1.5">
            <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{vendor}</span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 font-medium",
              inStock
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className="mt-3">
          <Rating rating={rating} reviewCount={reviewCount} />
        </div>

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-heading text-lg font-bold text-foreground">
              {formatPrice(price)}
            </span>
            {savings > 0 && (
              <>
                <span className="text-sm text-muted line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-xs font-medium text-success">
                  Save {formatPrice(savings)}
                </span>
              </>
            )}
          </div>

          <div
            className={`mt-3 grid gap-2 ${onDetails ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1"}`}
          >
            {onDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDetails}
                aria-label={`View details for ${name}`}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              disabled={!inStock}
              aria-label={`Add ${name} to cart`}
              onClick={async () => {
                const count = await add(medicine);

                notify.success(
                  `${name} added to your cart. ${count} item${count === 1 ? "" : "s"} total.`,
                );
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
