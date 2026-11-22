import { Link } from "react-router-dom";
import { CreditCard, Package, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatPrice } from "@/lib/format";
import { PATHS } from "@/utils/paths";
import { useAccount, useOrders, usePayments } from "../hooks/useDashboard";

const CARDS = [
  { label: "Orders", to: PATHS.ORDERS, icon: Package, hint: "Track and manage orders" },
  { label: "Payments", to: PATHS.PAYMENTS, icon: CreditCard, hint: "Transaction history" },
  { label: "Profile", to: PATHS.PROFILE, icon: UserRound, hint: "Contact and address" },
  { label: "Security", to: PATHS.SECURITY, icon: ShieldCheck, hint: "Password and account" },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const accountQuery = useAccount();
  const ordersQuery = useOrders({ page: 1, limit: 5 });
  const paymentsQuery = usePayments({ page: 1, limit: 5 });
  const account = accountQuery.data ?? user;

  const paidTotal = (paymentsQuery.data?.items ?? [])
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <section className="space-y-8">
      <div className="rounded-[1.5rem] bg-linear-to-br from-teal-700 via-emerald-700 to-teal-900 p-6 text-white shadow-card sm:p-8">
        <p className="text-sm font-medium text-teal-100">Welcome back</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
          {account?.name ?? account?.username ?? "Valued customer"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Manage your medicines, orders and payments from one place.
        </p>
        <Link
          to={PATHS.SHOP}
          className="mt-6 inline-flex items-center gap-2 rounded-control bg-white px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Shop medicines
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">Total orders</p>
          <p className="mt-2 font-heading text-2xl font-bold">
            {ordersQuery.data?.pagination?.total ?? "—"}
          </p>
        </div>
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">Successful payments</p>
          <p className="mt-2 font-heading text-2xl font-bold">
            {paymentsQuery.data?.items?.filter((item) => item.status === "paid").length ?? "—"}
          </p>
        </div>
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">Paid amount (recent)</p>
          <p className="mt-2 font-heading text-2xl font-bold">{formatPrice(paidTotal)}</p>
        </div>
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold">Quick access</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map(({ label, to, icon: Icon, hint }) => (
            <Link
              key={to}
              to={to}
              className="rounded-card border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-soft text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-heading font-semibold">{label}</h3>
              <p className="mt-1 text-xs text-muted">{hint}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
