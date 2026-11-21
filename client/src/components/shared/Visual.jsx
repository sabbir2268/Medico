import {
  Activity,
  Baby,
  Bandage,
  Clock,
  Droplet,
  Droplets,
  FileText,
  HeartPulse,
  Leaf,
  Pill,
  PillBottle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Tablet,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ICONS = {
  capsule: Pill,
  tablet: Tablet,
  bottle: PillBottle,
  syrup: Droplets,
  droplet: Droplet,
  inhaler: Wind,
  monitor: Activity,
  syringe: Syringe,
  vitamin: Sparkles,
  heart: HeartPulse,
  diabetes: Droplets,
  allergy: Leaf,
  device: Stethoscope,
  firstaid: Bandage,
  prescription: FileText,
  otc: Pill,
  baby: Baby,
  shield: ShieldCheck,
  clock: Clock,
};

const TONES = {
  teal: "border-teal-100 from-teal-50 via-emerald-50 to-teal-100 text-teal-700 dark:border-teal-900/70 dark:from-teal-950/70 dark:via-teal-950/40 dark:to-emerald-950/60 dark:text-teal-300",
  emerald:
    "border-emerald-100 from-emerald-50 via-green-50 to-emerald-100 text-emerald-700 dark:border-emerald-900/70 dark:from-emerald-950/70 dark:via-emerald-950/40 dark:to-green-950/60 dark:text-emerald-300",
  amber:
    "border-amber-100 from-amber-50 via-orange-50 to-amber-100 text-amber-700 dark:border-amber-900/70 dark:from-amber-950/70 dark:via-amber-950/40 dark:to-orange-950/60 dark:text-amber-300",
  blue: "border-blue-100 from-blue-50 via-sky-50 to-blue-100 text-blue-700 dark:border-blue-900/70 dark:from-blue-950/70 dark:via-sky-950/40 dark:to-blue-950/60 dark:text-blue-300",
  rose: "border-rose-100 from-rose-50 via-pink-50 to-rose-100 text-rose-700 dark:border-rose-900/70 dark:from-rose-950/70 dark:via-rose-950/40 dark:to-pink-950/60 dark:text-rose-300",
  violet:
    "border-violet-100 from-violet-50 via-purple-50 to-violet-100 text-violet-700 dark:border-violet-900/70 dark:from-violet-950/70 dark:via-violet-950/40 dark:to-purple-950/60 dark:text-violet-300",
  cyan: "border-cyan-100 from-cyan-50 via-sky-50 to-cyan-100 text-cyan-700 dark:border-cyan-900/70 dark:from-cyan-950/70 dark:via-cyan-950/40 dark:to-sky-950/60 dark:text-cyan-300",
};

/**
 * Decorative, asset-free product artwork. Keeping it as a component means
 * every card, category, and article uses the same visual language.
 */
export function Visual({ name = "capsule", tone = "teal", className, iconClassName }) {
  const Icon = ICONS[name] ?? Pill;
  const toneClass = TONES[tone] ?? TONES.teal;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-card border bg-linear-to-br",
        toneClass,
        className,
      )}
    >
      <span className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/50 dark:bg-white/5" />
      <span className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/35 dark:bg-white/5" />
      <Icon className={cn("relative h-1/2 w-1/2", iconClassName)} strokeWidth={1.35} />
    </div>
  );
}
