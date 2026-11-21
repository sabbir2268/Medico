import { useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Pill,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { SectionEmpty, SectionError, HeroSkeleton } from "./HomeStates";
import "swiper/css";
import "swiper/css/pagination";
import "../home.css";

function CtaLink({ href, className, children }) {
  if (href?.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href || "/shop"} className={className}>
      {children}
    </Link>
  );
}

function HeroSlide({ slide }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="grid gap-8 rounded-card border border-line bg-surface p-6 shadow-card sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-12">
      <div>
        <span className="inline-flex items-center gap-2 rounded-pill bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {slide.badge}
        </span>

        <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
          {slide.title}
        </h2>
        <p className="mt-4 max-w-xl text-sm text-muted sm:text-base">
          {slide.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <CtaLink href={slide.ctaHref} className={buttonVariants({ size: "lg" })}>
            {slide.ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </CtaLink>
          <CtaLink
            href={slide.secondaryHref}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {slide.secondaryLabel}
          </CtaLink>
        </div>

        <div className="mt-8 grid gap-3 text-xs text-muted sm:grid-cols-3">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Verified vendors
          </span>
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
            Tracked delivery
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            Pharmacist support
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-card bg-primary-soft/40">
          {slide.image && !imageFailed ? (
            <img
              src={slide.image}
              alt={slide.imageAlt}
              onError={() => setImageFailed(true)}
              className="h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
            />
          ) : (
            <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary-soft to-secondary sm:h-80 lg:h-[26rem]">
              <Pill className="h-20 w-20 text-primary" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="mt-3 rounded-card border border-line bg-surface/95 p-3 shadow-card backdrop-blur lg:absolute lg:-bottom-4 lg:left-4 lg:mt-0 lg:max-w-xs">
          <p className="flex items-center gap-2 text-sm font-medium">
            <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Licensed pharmacy
          </p>
          <p className="mt-1 text-xs text-muted">{slide.note}</p>
        </div>
      </div>
    </div>
  );
}

export function HeroSlider({ query }) {
  if (query.isLoading) {
    return <HeroSkeleton />;
  }

  if (query.items.length === 0) {
    return (
      <SectionEmpty
        title="Featured promotions are on the way"
        message="Our pharmacy team is preparing this week's featured medicines. Browse the full shop in the meantime."
        actionLabel="Browse medicines"
        actionTo="/shop"
      />
    );
  }

  return (
    <section aria-labelledby="hero-heading" className="space-y-4">
      <h2 id="hero-heading" className="sr-only">
        Featured medicines and offers
      </h2>

      {query.isError ? (
        <SectionError
          title="Live promotions could not be loaded"
          message="Showing curated picks from the Medico team while the catalog reconnects."
          onRetry={query.refetch}
          isRetrying={query.isFetching}
        />
      ) : null}

      <Swiper
        modules={[Autoplay, Pagination, A11y]}
        slidesPerView={1}
        loop={query.items.length > 1}
        autoplay={{ delay: 6500, disableOnInteraction: false }}
        pagination={{ clickable: true, el: ".home-hero-pagination" }}
        a11y={{ enabled: true }}
        className="home-hero-swiper"
      >
        {query.items.map((slide) => (
          <SwiperSlide key={slide.id}>
            <HeroSlide slide={slide} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="home-hero-pagination flex justify-center gap-1" />
    </section>
  );
}
