import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const ASSURANCES = [
  {
    icon: Truck,
    title: "Fast, careful delivery",
    description: "Temperature-aware packing on every order",
  },
  {
    icon: ShieldCheck,
    title: "Verified vendors only",
    description: "Licensed pharmacies, checked before listing",
  },
  {
    icon: RotateCcw,
    title: "Simple returns",
    description: "30-day window on eligible health essentials",
  },
  {
    icon: Headphones,
    title: "Pharmacist support",
    description: "Real advice, seven days a week",
  },
];

export function TrustStrip() {
  return (
    <section aria-label="Why shop with Medico" className="mb-14 sm:mb-16 lg:mb-20">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {ASSURANCES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-3 bg-surface p-4 sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
