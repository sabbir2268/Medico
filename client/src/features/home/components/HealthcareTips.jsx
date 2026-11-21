import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartPulse,
  Leaf,
  MessageCircle,
  Package,
  Stethoscope,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { PATHS } from "@/utils/paths";
import { SectionHeading } from "./SectionHeading";
import { SectionEmpty, SectionError, TipGridSkeleton } from "./HomeStates";

const ICONS = {
  HeartPulse,
  Leaf,
  Package,
  Stethoscope,
};

function TipCard({ tip }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = ICONS[tip.icon] ?? Leaf;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-primary-soft/40">
        {tip.image && !imageFailed ? (
          <img
            src={tip.image}
            alt={tip.imageAlt}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-soft to-secondary">
            <Leaf className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-pill bg-surface/95 px-2.5 py-1 text-xs font-semibold text-primary">
          {tip.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {tip.readTime}
        </p>
        <h3 className="mt-2 text-lg font-semibold leading-snug">
          <Link to={tip.href} className="transition-colors hover:text-primary">
            {tip.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{tip.excerpt}</p>
        <Link
          to={tip.href}
          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary hover:underline"
        >
          Read article
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function HealthcareTips({ query }) {
  return (
    <section
      id="health-tips"
      className="scroll-mt-24 space-y-6"
      aria-label="Healthcare tips"
    >
      <SectionHeading
        eyebrow="Health library"
        title="Practical healthcare tips"
        description="Clear, pharmacist-reviewed guidance for everyday decisions about medicines and wellbeing."
        action={
          <Link
            to={PATHS.ABOUT}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Visit health library
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      {query.isLoading ? <TipGridSkeleton /> : null}

      {!query.isLoading && query.isError ? (
        <SectionError
          title="Healthcare tips could not be loaded"
          message="Showing trusted guidance from the Medico health library while the service reconnects."
          onRetry={query.refetch}
          isRetrying={query.isFetching}
        />
      ) : null}

      {!query.isLoading && query.items.length === 0 ? (
        <SectionEmpty
          title="No healthcare tips yet"
          message="New pharmacist-reviewed articles are published regularly. Please check back soon."
          actionLabel="Learn about Medico"
          actionTo={PATHS.ABOUT}
        />
      ) : null}

      {!query.isLoading && query.items.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          {query.items.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-card bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-foreground/15">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold">Not sure which medicine is right for you?</h3>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Ask a pharmacist about dosage, interactions, and when to seek urgent care.
            </p>
          </div>
        </div>
        <Link
          to={PATHS.ABOUT}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Ask a pharmacist
        </Link>
      </div>
    </section>
  );
}
