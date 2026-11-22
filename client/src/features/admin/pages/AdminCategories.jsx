import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/features/auth/components/FormFields";
import { ConfirmDialog } from "@/features/dashboard/components/ConfirmDialog";
import { AdminContent, AdminPageHeader, SearchInput } from "../components/AdminUI";
import { useAdminCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "../hooks/useAdmin";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  visual: z.string().trim().max(40).optional().or(z.literal("")),
  isActive: z.boolean(),
});

export default function AdminCategories() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const query = useAdminCategories({ search, limit: 100 });
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "", visual: "capsule", isActive: true },
  });

  useEffect(() => {
    reset(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? "",
            visual: editing.visual ?? "capsule",
            isActive: editing.isActive,
          }
        : { name: "", description: "", visual: "capsule", isActive: true },
    );
  }, [editing, reset]);

  const onSubmit = async (values) => {
    const payload = { ...values, description: values.description ?? "", visual: values.visual || "capsule" };
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values: payload });
    else await createMutation.mutateAsync(payload);
    setEditing(null);
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Category management"
        description="Organize the catalog. Deactivating a category hides it from the storefront."
        actions={
          <Button onClick={() => setEditing({ new: true })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New category
          </Button>
        }
      />

      {editing && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card sm:grid-cols-2"
          noValidate
        >
          <FormField label="Name" name="name" error={errors.name} {...register("name")} />
          <FormField label="Visual key" name="visual" error={errors.visual} {...register("visual")} />
          <div className="sm:col-span-2">
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-control border border-line bg-background px-3 py-2 text-sm"
              {...register("description")}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isActive")} className="h-4 w-4" />
            Active
          </label>
          <div className="flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save category"}</Button>
          </div>
        </form>
      )}

      <SearchInput value={search} onChange={setSearch} placeholder="Search categories" />

      <AdminContent query={query} emptyTitle="No categories" emptyDescription="Create the first category.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.items.map((category) => (
            <div key={category.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading font-semibold">{category.name}</p>
                  <p className="text-xs text-muted">/{category.slug}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${category.isActive ? "bg-success/10 text-success" : "bg-muted/20 text-muted"}`}>
                  {category.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{category.description || "—"}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(category)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRemoving(category)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </AdminContent>

      <ConfirmDialog
        open={Boolean(removing)}
        title={`Delete ${removing?.name}?`}
        description="Categories containing medicines cannot be deleted. Deactivate it instead."
        confirmLabel="Delete category"
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
