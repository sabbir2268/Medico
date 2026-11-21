import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import "swiper/css";
import "../home.css";

function SliderButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface text-foreground transition-colors hover:bg-hover disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function ProductSlider({ products }) {
  const swiperRef = useRef(null);

  return (
    <div>
      <Swiper
        modules={[A11y]}
        spaceBetween={16}
        slidesPerView={1.15}
        breakpoints={{
          640: { slidesPerView: 2.15 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        watchOverflow
        a11y={{ enabled: true }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="home-product-swiper"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="mt-4 flex justify-end gap-2">
        <SliderButton
          label="Previous medicines"
          onClick={() => swiperRef.current?.slidePrev()}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </SliderButton>
        <SliderButton
          label="Next medicines"
          onClick={() => swiperRef.current?.slideNext()}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </SliderButton>
      </div>
    </div>
  );
}
