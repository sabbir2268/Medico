import { useState } from "react";
import { EyeOff, ShieldCheck, Slash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import {
  AdminContent,
  AdminPageHeader,
  PaginationControls,
  SearchInput,
} from "../components/AdminUI";
import { useAdminMedicines, useUpdateMedicineStatus } from "../hooks/useAdmin";
import { formatPrice } from "@/lib/format";

export default function AdminMedicines() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useAdminMedicines({ page, limit: 10, search, status });
  const mutation = useUpdateMedicineStatus();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Medicine management"
        description="Approve, hide or deactivate listings. Order and payment snapshots are never altered."
      />

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Medicine or manufacturer" />
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          className="rounded-control border border-line bg-background px-3 py-2 text-sm"
          aria-label="Filter medicines"
        >
          <option value="">All medicines</option>
          <option value="active">Active</option>
          <option value="pending">Awaiting approval</option>
          <option value="hidden">Hidden</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <AdminContent query={query} emptyTitle="No medicines found" emptyDescription="Try a different filter.">
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                {["Medicine", "Category", "Vendor", "Price", "Stock", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {query.data.items.map((medicine) => (
                <tr key={medicine.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{medicine.name}</p>
                    <p className="text-xs text-muted">{medicine.manufacturer}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{medicine.categoryName || "—"}</td>
                  <td className="px-4 py-3 text-muted">{medicine.vendor}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(medicine.price)}</td>
                  <td className="px-4 py-3">{medicine.stock}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={medicine.isApproved ? (medicine.status === "active" ? "delivered" : "cancelled") : "pending"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: medicine.id, status: "approved" })}>
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => mutation.mutate({ id: medicine.id, status: "hidden" })}>
                        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Hide
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => mutation.mutate({ id: medicine.id, status: "inactive" })}>
                        <Slash className="h-3.5 w-3.5" aria-hidden="true" /> Deactivate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminContent>

      <PaginationControls pagination={query.data?.pagination} page={page} setPage={setPage} />
    </section>
  );
}
