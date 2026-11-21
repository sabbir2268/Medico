import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Star,
  Truck,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { Visual } from "@/components/shared/Visual";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { useAdvertisedMedicines } from "../hooks/useHomeData";

const TONES = {
  "hero-teal": "from-teal-600 via-teal-700 to-emerald-800",
  "hero-blue": "from-sky-700 via-blue-800 to-teal-900",
  "hero-amber": "from-amber-600 via-teal-700 to-emerald-800",
  "hero-emerald": "from-emerald-600 via-teal-700 to-cyan-800",
};

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HeroSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-none bg-linear-to-br from-teal-700 to-emerald-800 px-6 py-16 sm:mx-4 sm:rounded-[1.75rem] sm:px-12 lg:mx-6 lg:py-24"
      aria-busy="true"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="h-6 w-40 rounded-full bg-white/20" />
          <div className="h-12 w-11/12 rounded-lg bg-white/20" />
          <div className="h-12 w-2/3 rounded-lg bg-white/20" />
          <div className="h-4 w-5/6 rounded-full bg-white/15" />
          <div className="h-4 w-3/4 rounded-full bg-white/15" />
          <div className="h-11 w-44 rounded-control bg-white/25" />
        </div>
        <div className="mx-auto aspect-square w-full max-w-sm rounded-[1.75rem] bg-white/15" />
      </div>
    </div>
  );
}

function HeroSlide({ slide }) {
  const medicine = slide.medicine ?? {};
  const tone = TONES[slide.tone] ?? TONES["hero-teal"];

  return (
    <div
      className={`relative overflow-hidden bg-linear-to-br ${tone} px-5 py-12 sm:rounded-[1.75rem] sm:px-10 sm:py-16 lg:px-16 lg:py-20`}
    >
      <span
        aria-hidden="true"
        className="absolute -top-28 -right-20 h-80 w-80 rounded-full border-[20px] border-white/5"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-white/5"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-teal-50 uppercase backdrop-blur">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {slide.eyebrow}
          </span>

          <h1 className="mt-5 font-heading text-3xl leading-[1.15] font-bold text-white sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
            {slide.title}
            <span className="mt-1 block text-teal-200">{slide.highlight}</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            {slide.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-teal-800 hover:bg-teal-50"
              onClick={() => scrollToSection(slide.targetId ?? "medicines")}
            >
              {slide.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => scrollToSection("categories")}
            >
              Browse categories
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-white/75">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" aria-hidden="true" />
              Free delivery over $30
            </span>
            <span className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Genuine products
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm pb-6 sm:max-w-md lg:pb-0">
          <Visual
            name={slide.visual}
            tone="teal"
            className="aspect-square w-full border-white/30 shadow-2xl"
            iconClassName="h-44 w-44 sm:h-56 sm:w-56"
          />
          <div className="absolute -right-2 -bottom-2 w-56 rounded-card border border-white/40 bg-surface/95 p-3.5 shadow-xl backdrop-blur sm:-right-6 sm:w-64">
            <p className="text-[10px] font-semibold tracking-wide text-primary uppercase">
              {medicine.vendor}
            </p>
            <p className="mt-1 line-clamp-2 font-heading text-sm leading-snug font-semibold text-foreground">
              {medicine.name}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="font-heading text-base font-bold text-foreground">
                {formatPrice(medicine.price)}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                <Star
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
                {medicine.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSlider() {
  const query = useAdvertisedMedicines();
  const { items, isFallback } = query;

  return (
    <section id="top" aria-label="Featured promotions" className="relative">
      <AsyncContent query={query} skeleton={<HeroSkeleton />}>
        <Swiper
          className="hero-swiper"
          modules={[Autoplay, Pagination, Navigation, EffectFade, A11y]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={700}
          loop={items.length > 1}
          autoplay={{
            delay: 6500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ el: ".hero-pagination", clickable: true }}
          navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
          a11y={{
            prevSlideMessage: "Previous promotion",
            nextSlideMessage: "Next promotion",
            paginationBulletMessage: "Go to promotion {{index}}",
          }}
        >
          {items.map((slide) => (
            <SwiperSlide key={slide.id}>
              <HeroSlide slide={slide} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="flex items-center justify-between gap-4 py-4">
          <p className="text-xs text-muted">
            {isFallback ? "Curated promotions" : "Selected by our pharmacy team"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hero-prev flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-sm transition hover:bg-primary hover:text-primary-foreground"
              aria-label="Previous promotion"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="hero-pagination flex items-center gap-1.5" />
            <button
              type="button"
              className="hero-next flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-sm transition hover:bg-primary hover:text-primary-foreground"
              aria-label="Next promotion"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </AsyncContent>
    </section>
  );
}
