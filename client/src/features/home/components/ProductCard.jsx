import { useState } from "react";
import { Link } from "react-router-dom";
import { Pill, ShieldCheck, Star, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { cn } from "@/lib/cn";
import { PATHS } from "@/utils/paths";
import { formatCount, formatPrice } from "../utils/format";

export function ProductCard({ product, className }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasDiscount = product.discountPercent > 0 && product.originalPrice > product.price;
  const productKey = product.slug ?? product.id;
  const productHref = productKey
    ? `${PATHS.SHOP}?medicine=${encodeURIComponent(productKey)}`
    : PATHS.SHOP;
  const isOutOfStock = product.stock === 0;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-primary-soft/40">
        {product.image && !imageFailed ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft to-secondary">
            <Pill className="h-14 w-14 text-primary" aria-hidden="true" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {hasDiscount ? (
            <span className="rounded-pill bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
              -{product.discountPercent}%
            </span>
          ) : null}
          {product.prescriptionRequired ? (
            <span className="rounded-pill bg-surface/95 px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-line">
              Rx
            </span>
          ) : null}
        </div>

        {isOutOfStock ? (
          <span className="absolute inset-x-3 bottom-3 rounded-control bg-foreground/85 px-3 py-1.5 text-center text-xs font-semibold text-background">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          {product.category}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">
          <Link to={productHref} className="transition-colors hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted">{product.brand}</p>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{product.vendor}</span>
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-sm">
          <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
          <span className="font-medium">
            {product.rating > 0 ? product.rating.toFixed(1) : "New"}
          </span>
          {product.reviewCount > 0 ? (
            <span className="text-xs text-muted">({formatCount(product.reviewCount)})</span>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
            {hasDiscount ? (
              <p className="text-xs text-muted line-through">
                {formatPrice(product.originalPrice)}
              </p>
            ) : null}
          </div>
          <Link
            to={productHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
            aria-label={`View ${product.name}`}
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
