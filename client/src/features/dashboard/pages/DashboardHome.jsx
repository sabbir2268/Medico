import { LayoutDashboard } from "lucide-react";

export default function DashboardHome() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Overview</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Account, order, and vendor tools will appear here as the application grows.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-soft text-primary">
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Dashboard shell is ready</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Routing, layouts, the API client, the query provider, and notifications are
          configured. Feature modules can now be added safely.
        </p>
      </div>
    </section>
  );
}
