import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { AdminContent, AdminPageHeader } from "../components/AdminUI";
import { ReasonDialog } from "../components/ReasonDialog";
import { useAdminAdvertisements, useUpdateAdStatus } from "../hooks/useAdmin";

export default function AdminAdvertisements() {
  const query = useAdminAdvertisements();
  const mutation = useUpdateAdStatus();
  const [decision, setDecision] = useState(null);

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Advertisement management"
        description="Approved ads become publicly active; rejected ads require a reason."
      />

      <AdminContent query={{ ...query, data: { items: query.data ?? [] } }} emptyTitle="No advertisements" emptyDescription="Seller ad requests will appear here.">
        <div className="space-y-3">
          {(query.data ?? []).map((ad) => (
            <div key={ad.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold">{ad.title}</p>
                  <p className="mt-1 text-sm text-muted">{ad.subtitle}</p>
                </div>
                <StatusBadge status={ad.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setDecision({ id: ad.id, status: "approved" })}>Approve</Button>
                <Button size="sm" variant="ghost" onClick={() => setDecision({ id: ad.id, status: "rejected" })}>Reject</Button>
                <Button size="sm" variant="ghost" onClick={() => setDecision({ id: ad.id, status: "pending" })}>Set pending</Button>
              </div>
              {ad.rejectionReason && <p className="mt-3 text-xs text-destructive">Reason: {ad.rejectionReason}</p>}
            </div>
          ))}
        </div>
      </AdminContent>

      <ReasonDialog
        open={Boolean(decision)}
        title={`${decision?.status ?? ""} advertisement?`}
        description="This decision is recorded in the audit log and controls public visibility."
        confirmLabel="Confirm"
        loading={mutation.isPending}
        onCancel={() => setDecision(null)}
        onConfirm={async (reason) => {
          await mutation.mutateAsync({ id: decision.id, status: decision.status, reason });
          setDecision(null);
        }}
      />
    </section>
  );
}
