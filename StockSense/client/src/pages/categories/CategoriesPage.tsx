import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { categoriesApi, Category } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { EmptyState, LoadingState, Card } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Plus, Tags, Package, Layers, Edit2, Trash2 } from "lucide-react";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
      setIsCreateOpen(false);
      setNameInput("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully");
      setEditingCategory(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
      setDeletingCategory(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete category");
    },
  });

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Product Categories"
        description="Organize your inventory catalog into distinct product lines and groupings."
        actions={
          <Button
            onClick={() => {
              setNameInput("");
              setIsCreateOpen(true);
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Category
          </Button>
        }
      />

      {/* Categories Table / Card Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={5} />
            </div>
          ) : !categories?.length ? (
            <EmptyState
              icon={<Tags className="h-10 w-10" />}
              title="No categories yet"
              description="Create categories to help classify and organize your products."
              action={
                <Button
                  onClick={() => {
                    setNameInput("");
                    setIsCreateOpen(true);
                  }}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add First Category
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th className="text-right">Products Count</th>
                  <th className="text-right">Total Stock Units</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                          <Tags className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-navy text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="text-right font-medium text-navy text-sm tabular-nums">
                      {c.product_count} product{c.product_count !== 1 ? "s" : ""}
                    </td>
                    <td className="text-right font-semibold text-navy text-sm tabular-nums">
                      {c.stock_units.toLocaleString()} units
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setNameInput(c.name);
                          }}
                          title="Edit Category"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-surface transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(c)}
                          title="Delete Category"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Category"
        description="Add a new product category to classify your inventory."
        width="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!nameInput.trim()) return;
            createMutation.mutate({ name: nameInput.trim() });
          }}
          className="space-y-4"
        >
          <FormField label="Category Name" required>
            <input
              type="text"
              required
              autoFocus
              className="input-field"
              placeholder="e.g. Raw Materials, Electronics"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingCategory && (
        <Modal
          open={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          title="Edit Category"
          width="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!nameInput.trim()) return;
              updateMutation.mutate({
                id: editingCategory.id,
                data: { name: nameInput.trim() },
              });
            }}
            className="space-y-4"
          >
            <FormField label="Category Name" required>
              <input
                type="text"
                required
                autoFocus
                className="input-field"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" type="button" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingCategory && (
        <ConfirmDialog
          open={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={() => deleteMutation.mutate(deletingCategory.id)}
          title="Delete Category"
          description={`Are you sure you want to delete "${deletingCategory.name}"? Products attached to this category may become uncategorized.`}
          confirmLabel="Delete Category"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
