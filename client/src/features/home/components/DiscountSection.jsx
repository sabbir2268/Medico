import { ChevronLeft, ChevronRight, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Navigation } from "swiper/modules";
import { AsyncContent, SkeletonGrid } from "@/components/shared/AsyncContent";
import { MedicineCard } from "@/components/shared/MedicineCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useDiscountedMedicines } from "../hooks/useHomeData";

export function DiscountSection() {
  const query = useDiscountedMedicines();

  const heading = (
    <SectionHeading
      eyebrow="Limited-time offers"
      title="Discounted medicines, same trusted quality"
      description="Real savings on the medicines and wellness essentials you already rely on. Offers rotate weekly across all verified vendors."
      isFallback={query.isFallback}
      action={
        <div className="flex items-center gap-2">
          <Link
            to={{ pathname: "/", hash: "#featured-medicines" }}
            className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
          >
            View all medicines
            <LinkIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="deals-prev flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-sm transition hover:bg-primary hover:text-primary-foreground"
            aria-label="Previous deals"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="deals-next flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-sm transition hover:bg-primary hover:text-primary-foreground"
            aria-label="Next deals"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      }
    />
  );

  return (
    <section
      id="deals"
      className="scroll-mt-24 rounded-[1.5rem] border border-primary/10 bg-linear-to-b from-accent/60 to-surface p-4 py-10 sm:p-8 sm:py-12 lg:p-10"
    >
      {heading}
      <AsyncContent
        query={query}
        skeleton={<SkeletonGrid count={4} />}
        className="px-0.5 pb-2"
      >
        <Swiper
          className="deals-swiper"
          modules={[Navigation, Keyboard, A11y]}
          spaceBetween={16}
          slidesPerView={1.15}
          navigation={{ prevEl: ".deals-prev", nextEl: ".deals-next" }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{
            prevSlideMessage: "Previous deal",
            nextSlideMessage: "Next deal",
          }}
          breakpoints={{
            480: { slidesPerView: 2, spaceBetween: 16 },
            768: { slidesPerView: 3, spaceBetween: 18 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
          }}
        >
          {query.items.map((medicine) => (
            <SwiperSlide key={medicine.id} className="h-auto">
              <MedicineCard medicine={medicine} />
            </SwiperSlide>
          ))}
        </Swiper>
      </AsyncContent>
    </section>
  );
}
