import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/features/auth/components/FormFields";
import { ConfirmDialog } from "@/features/dashboard/components/ConfirmDialog";
import { AdminContent, AdminPageHeader, PaginationControls } from "../components/AdminUI";
import {
  useAdminHealthTips,
  useCreateHealthTip,
  useDeleteHealthTip,
  useUpdateHealthTip,
} from "../hooks/useAdmin";

const tipSchema = z.object({
  title: z.string().trim().min(3, "Enter a title").max(200),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().max(10000).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  visual: z.string().trim().max(40).optional().or(z.literal("")),
  isActive: z.boolean(),
});

const emptyValues = {
  title: "",
  excerpt: "",
  content: "",
  category: "General",
  visual: "heart",
  isActive: true,
};

export default function AdminHealthTips() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const query = useAdminHealthTips({ page, limit: 10 });
  const createMutation = useCreateHealthTip();
  const updateMutation = useUpdateHealthTip();
  const deleteMutation = useDeleteHealthTip();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(tipSchema), defaultValues: emptyValues });

  useEffect(() => {
    reset(
      editing?.id
        ? {
            title: editing.title,
            excerpt: editing.excerpt ?? "",
            content: editing.content ?? "",
            category: editing.category ?? "General",
            visual: editing.visual ?? "heart",
            isActive: editing.isActive,
          }
        : emptyValues,
    );
  }, [editing, reset]);

  const onSubmit = async (values) => {
    if (editing?.id) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
    setEditing(null);
  };

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Health tips"
        description="Publish educational content for the storefront."
        actions={<Button onClick={() => setEditing({ new: true })}><Plus className="h-4 w-4" /> New tip</Button>}
      />

      {editing && (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card sm:grid-cols-2" noValidate>
          <FormField label="Title" name="title" error={errors.title} {...register("title")} />
          <FormField label="Category" name="category" error={errors.category} {...register("category")} />
          <div className="sm:col-span-2">
            <label htmlFor="excerpt" className="mb-1.5 block text-sm font-medium">Excerpt</label>
            <textarea id="excerpt" rows={2} className="w-full rounded-control border border-line bg-background px-3 py-2 text-sm" {...register("excerpt")} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="content" className="mb-1.5 block text-sm font-medium">Content</label>
            <textarea id="content" rows={4} className="w-full rounded-control border border-line bg-background px-3 py-2 text-sm" {...register("content")} />
          </div>
          <FormField label="Visual key" name="visual" error={errors.visual} {...register("visual")} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isActive")} className="h-4 w-4" /> Published
          </label>
          <div className="flex gap-2 sm:col-span-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
          </div>
        </form>
      )}

      <AdminContent query={query} emptyTitle="No health tips" emptyDescription="Create the first tip.">
        <div className="grid gap-3 md:grid-cols-2">
          {(query.data?.items ?? []).map((tip) => (
            <div key={tip.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
              <p className="font-heading font-semibold">{tip.title}</p>
              <p className="mt-1 text-sm text-muted">{tip.excerpt}</p>
              <p className="mt-3 text-xs text-muted">
                {tip.category} · {tip.isActive ? "Published" : "Draft"}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(tip)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRemoving(tip)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </AdminContent>

      <PaginationControls pagination={query.data?.pagination} page={page} setPage={setPage} />

      <ConfirmDialog
        open={Boolean(removing)}
        title={`Delete ${removing?.title}?`}
        description="This cannot be undone."
        confirmLabel="Delete tip"
        loading={deleteMutation.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(removing.id);
          setRemoving(null);
        }}
      />
    </section>
  );
}
