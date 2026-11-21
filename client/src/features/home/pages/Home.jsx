import { CategorySection } from "../components/CategorySection";
import { DiscountSection } from "../components/DiscountSection";
import { FeaturedSection } from "../components/FeaturedSection";
import { HealthTipsSection } from "../components/HealthTipsSection";
import { HeroSlider } from "../components/HeroSlider";
import { TrustStrip } from "../components/TrustStrip";

export default function Home() {
  return (
    <div className="space-y-14 sm:space-y-16 lg:space-y-20">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <HeroSlider />
      </div>

      <TrustStrip />
      <CategorySection />
      <DiscountSection />
      <FeaturedSection />
      <HealthTipsSection />
    </div>
  );
}
