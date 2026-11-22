import { useState } from "react";
import { AdminContent, AdminPageHeader, PaginationControls } from "../components/AdminUI";
import { useAdminAuditLogs } from "../hooks/useAdmin";

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const query = useAdminAuditLogs({ page, limit: 20 });

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Sensitive administrative actions are recorded here."
      />

      <AdminContent query={query} emptyTitle="No audit entries" emptyDescription="Actions such as role changes and approvals will appear here.">
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                {["Action", "Admin", "Target", "Details", "When"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(query.data?.items ?? []).map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-medium">{log.action}</td>
                  <td className="px-4 py-3 text-muted">{log.admin?.username ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{log.targetType} {log.targetId?.slice(-6)}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {JSON.stringify(log.details ?? {}).slice(0, 100)}
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
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
