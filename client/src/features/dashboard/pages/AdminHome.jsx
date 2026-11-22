import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, Boxes, CircleDollarSign, ClipboardList, Store, Users } from "lucide-react";
import { useAdminAnalytics, useAdminDashboard } from "@/features/admin/hooks/useAdmin";
import { formatPrice } from "@/lib/format";
import { PATHS } from "@/utils/paths";

const CARDS = [
  { label: "Revenue", key: "revenue", icon: CircleDollarSign, money: true },
  { label: "Orders", key: "orders", icon: ClipboardList },
  { label: "Users", key: "users", icon: Users },
  { label: "Sellers", key: "sellers", icon: Store },
  { label: "Medicines", key: "medicines", icon: Boxes },
];

export default function AdminHome() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const dashboard = useAdminDashboard();
  const analytics = useAdminAnalytics({ from: from || undefined, to: to || undefined });

  const summary = dashboard.data ?? {};
  const series = analytics.data?.series ?? [];

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-primary">Administration</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Platform overview</h1>
        <p className="mt-2 text-sm text-muted">Live figures from verified orders and payments.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CARDS.map(({ label, key, icon: Icon, money }) => (
          <div key={key} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-4 text-sm text-muted">{label}</p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {money ? formatPrice(summary[key] ?? 0) : (summary[key] ?? "—")}
            </p>
          </div>
        ))}
      </div>

      {(summary.pendingApprovals?.advertisements > 0 || summary.pendingApprovals?.sellers > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {summary.pendingApprovals.advertisements} advertisements and{" "}
          {summary.pendingApprovals.sellers} sellers awaiting review.
          <Link to={PATHS.ADMIN_ADS} className="font-semibold underline">
            Review now
          </Link>
        </div>
      )}

      <section className="rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Sales analytics</h2>
            <p className="mt-1 text-sm text-muted">Revenue and orders grouped by day.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs text-muted">
              From
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="ml-2 rounded-control border border-line bg-background px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs text-muted">
              To
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="ml-2 rounded-control border border-line bg-background px-2 py-1 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 h-72">
          {analytics.isPending ? (
            <div className="h-full animate-pulse rounded-control bg-hover" />
          ) : series.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: "var(--muted)" }} />
                <YAxis fontSize={11} tick={{ fill: "var(--muted)" }} />
                <Tooltip cursor={{ fill: "var(--hover)" }} />
                <Bar dataKey="revenue" fill="var(--brand)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted">No sales in the selected period.</p>
          )}
        </div>
      </section>
    </section>
  );
}
