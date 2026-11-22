import { useState } from "react";
import { Ban, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { ConfirmDialog } from "@/features/dashboard/components/ConfirmDialog";
import { ROLES } from "@/constants/roles";
import {
  AdminContent,
  AdminPageHeader,
  PaginationControls,
  SearchInput,
} from "../components/AdminUI";
import { useAdminUsers, useDeleteUser, useUpdateUserRole, useUpdateUserStatus } from "../hooks/useAdmin";

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [confirm, setConfirm] = useState(null);

  const query = useAdminUsers({ page, limit: 10, search, role, status });
  const roleMutation = useUpdateUserRole();
  const statusMutation = useUpdateUserStatus();
  const deleteMutation = useDeleteUser();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="User management"
        description="Search users, adjust roles and block accounts. Admin roles are never self-assignable."
      />

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Name or email" />
        <select
          value={role}
          onChange={(event) => { setRole(event.target.value); setPage(1); }}
          className="rounded-control border border-line bg-background px-3 py-2 text-sm"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {Object.values(ROLES).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          className="rounded-control border border-line bg-background px-3 py-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <AdminContent query={query} emptyTitle="No users found" emptyDescription="Try different filters.">
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                {["User", "Role", "Status", "Joined", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {query.data.items.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(event) => roleMutation.mutate({ id: user.id, role: event.target.value })}
                      className="rounded-control border border-line bg-background px-2 py-1 text-sm capitalize"
                      aria-label={`Role for ${user.username}`}
                    >
                      {Object.values(ROLES).map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.isActive ? "delivered" : "cancelled"} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={user.isActive ? "Block user" : "Unblock user"}
                        onClick={() => statusMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      >
                        {user.isActive ? <Ban className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete user"
                        onClick={() => setConfirm({ id: user.id, name: user.username })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Remove ${confirm?.name}?`}
        description="The account is deactivated, but historical orders and payments are preserved."
        confirmLabel="Remove user"
        loading={deleteMutation.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(confirm.id);
          setConfirm(null);
        }}
      />
    </section>
  );
}
