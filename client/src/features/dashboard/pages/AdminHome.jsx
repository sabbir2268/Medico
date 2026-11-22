import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDiscountedMedicines } from "@/features/home/hooks/useHomeData";

/** Admin-only overview. Data comes from the real catalog API. */
export default function AdminHome() {
  const { items, isPending } = useDiscountedMedicines();
  const chartData = items.slice(0, 8).map((medicine) => ({
    name: medicine.name.slice(0, 16),
    price: medicine.price,
  }));

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Administration</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Platform overview</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Live pricing summary from discounted medicines in the catalog.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <h2 className="font-heading text-base font-semibold">Discounted medicine prices</h2>
        <div className="mt-5 h-72 w-full" aria-busy={isPending}>
          {isPending ? (
            <div className="h-full animate-pulse rounded-control bg-hover" />
          ) : chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" fontSize={11} tick={{ fill: "var(--muted)" }} />
                <YAxis fontSize={11} tick={{ fill: "var(--muted)" }} />
                <Tooltip cursor={{ fill: "var(--hover)" }} />
                <Bar dataKey="price" fill="var(--brand)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted">No discounted medicines available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
