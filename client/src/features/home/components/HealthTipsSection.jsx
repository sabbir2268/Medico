import { ArrowUpRight, CalendarDays, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { AsyncContent, SkeletonGrid } from "@/components/shared/AsyncContent";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Visual } from "@/components/shared/Visual";
import { formatDate } from "@/lib/format";
import { useHealthTips } from "../hooks/useHomeData";

function TipMeta({ tip }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
        {formatDate(tip.publishedAt)}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {tip.readMinutes} min read
      </span>
    </div>
  );
}

function FeaturedTip({ tip }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <Visual
        name={tip.visual}
        tone={tip.tone}
        className="h-44 w-full rounded-none border-x-0 border-t-0 sm:h-56"
        iconClassName="h-20 w-20"
      />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <span className="w-fit rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
          {tip.category}
        </span>
        <h3 className="mt-3 font-heading text-lg leading-snug font-bold text-foreground sm:text-xl">
          {tip.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{tip.excerpt}</p>
        <TipMeta tip={tip} />
        <Link
          to={{ pathname: "/", hash: "#health-tips" }}
          className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary hover:underline"
        >
          Read article
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function CompactTip({ tip }) {
  return (
    <article className="group flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition hover:border-primary/40">
      <Visual
        name={tip.visual}
        tone={tip.tone}
        className="h-16 w-16 shrink-0"
        iconClassName="h-8 w-8"
      />
      <div className="min-w-0">
        <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">
          {tip.category}
        </span>
        <h3 className="mt-1 line-clamp-2 font-heading text-sm leading-snug font-semibold text-foreground">
          {tip.title}
        </h3>
        <p className="mt-1.5 text-xs text-muted">
          {tip.readMinutes} min read · {formatDate(tip.publishedAt)}
        </p>
      </div>
    </article>
  );
}

export function HealthTipsSection() {
  const query = useHealthTips();
  const [featured, ...rest] = query.items;

  return (
    <section id="health-tips" className="scroll-mt-24">
      <div className="rounded-[1.5rem] bg-linear-to-br from-secondary/70 via-surface to-accent/70 p-4 py-10 sm:p-8 sm:py-12 lg:p-10">
        <SectionHeading
          eyebrow="Healthcare tips"
          title="Good advice for healthier days"
          description="Short, practical guides written with our partner pharmacists — so you can use medicines safely and feel better, sooner."
          isFallback={query.isFallback}
          action={
            <Link
              to={{ pathname: "/", hash: "#health-tips" }}
              className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
            >
              All health articles
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        <AsyncContent
          query={query}
          skeleton={<SkeletonGrid count={3} />}
          className="grid gap-5 lg:grid-cols-[1.15fr_1fr]"
        >
          {featured && <FeaturedTip tip={featured} />}
          {rest.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {rest.slice(0, 3).map((tip) => (
                <CompactTip key={tip.id} tip={tip} />
              ))}
            </div>
          )}
        </AsyncContent>
      </div>
    </section>
  );
}
