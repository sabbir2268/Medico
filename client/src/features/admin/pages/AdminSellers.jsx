import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import {
  AdminContent,
  AdminPageHeader,
  PaginationControls,
  SearchInput,
} from "../components/AdminUI";
import { ReasonDialog } from "../components/ReasonDialog";
import { useAdminSellers, useUpdateSellerStatus } from "../hooks/useAdmin";

export default function AdminSellers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [decision, setDecision] = useState(null);
  const query = useAdminSellers({ page, limit: 10, search, status });
  const mutation = useUpdateSellerStatus();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Seller management"
        description="Approve, suspend or reject vendor accounts. Sellers cannot access other vendors' data."
      />

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Seller name or email" />
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          className="rounded-control border border-line bg-background px-3 py-2 text-sm"
          aria-label="Filter sellers"
        >
          <option value="">All statuses</option>
          {["pending", "approved", "suspended", "rejected"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <AdminContent query={query} emptyTitle="No sellers found" emptyDescription="Try a different filter.">
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                {["Seller", "Status", "Joined", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(query.data?.items ?? []).map((seller) => (
                <tr key={seller.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{seller.username}</p>
                    <p className="text-xs text-muted">{seller.email}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={seller.sellerStatus} /></td>
                  <td className="px-4 py-3 text-muted">{new Date(seller.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => setDecision({ id: seller.id, status: "approved" })}>
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDecision({ id: seller.id, status: "suspended" })}>
                        Suspend
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDecision({ id: seller.id, status: "rejected" })}>
                        Reject
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

      <ReasonDialog
        open={Boolean(decision)}
        title={`${decision?.status ?? ""} seller?`}
        description="This decision is recorded in the admin audit log."
        confirmLabel={`Confirm ${decision?.status ?? ""}`}
        loading={mutation.isPending}
        requireReason={decision?.status === "rejected"}
        onCancel={() => setDecision(null)}
        onConfirm={async (reason) => {
          await mutation.mutateAsync({ id: decision.id, status: decision.status, reason });
          setDecision(null);
        }}
      />
    </section>
  );
}
