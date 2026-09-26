import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  reorderRulesApi,
  productsApi,
  locationsApi,
  ReorderRule,
} from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import {
  StatusBadge,
  EmptyState,
  LoadingState,
  KPICard,
} from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import {
  Plus,
  RefreshCcw,
  AlertTriangle,
  CheckCircle,
  Edit2,
  Trash2,
  Package,
} from "lucide-react";

export default function ReorderRulesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<ReorderRule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    location_id: "",
    min_qty: 10,
    max_qty: 50,
  });

  // Queries
  const { data: rules, isLoading } = useQuery({
    queryKey: ["reorder-rules"],
    queryFn: reorderRulesApi.list,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsApi.list(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: reorderRulesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reorder-rules"] });
      toast.success("Reorder rule created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create reorder rule");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      reorderRulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reorder-rules"] });
      toast.success("Reorder rule updated");
      setEditingRule(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update reorder rule");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reorderRulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reorder-rules"] });
      toast.success("Reorder rule deleted");
      setDeletingRule(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete reorder rule");
    },
  });

  const resetForm = () => {
    setFormData({
      product_id: products?.[0]?.id || "",
      location_id: locations?.[0]?.id || "",
      min_qty: 10,
      max_qty: 50,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    if (products?.length) {
      setFormData((prev) => ({ ...prev, product_id: products[0].id }));
    }
    if (locations?.length) {
      setFormData((prev) => ({ ...prev, location_id: locations[0].id }));
    }
    setIsCreateOpen(true);
  };

  const totalRules = rules?.length ?? 0;
  const needReorderCount =
    rules?.filter((r) => r.status === "needs_reorder" || r.status === "critical").length ?? 0;
  const healthyCount = rules?.filter((r) => r.status === "healthy").length ?? 0;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Automated Reordering Rules"
        description="Set minimum threshold stock levels and target replenishment targets per warehouse location."
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            Add Reorder Rule
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Active Rules"
          value={totalRules}
          icon={<RefreshCcw className="h-4 w-4" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="Needs Reordering"
          value={needReorderCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPICard
          title="Stock Within Target"
          value={healthyCount}
          icon={<CheckCircle className="h-4 w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Rules Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={5} />
            </div>
          ) : !rules?.length ? (
            <EmptyState
              icon={<RefreshCcw className="h-10 w-10" />}
              title="No reordering rules"
              description="Configure minimum and maximum target quantities to automate replenishment warnings."
              action={
                <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
                  Create First Reorder Rule
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Location</th>
                  <th className="text-right">Min Qty</th>
                  <th className="text-right">Max Qty</th>
                  <th className="text-right">Current Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className="font-semibold text-navy text-sm">
                        {r.product_name || "Product"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-navy-500 bg-surface px-2 py-0.5 rounded border border-border">
                        {r.sku || "—"}
                      </span>
                    </td>
                    <td className="text-sm text-navy-600">{r.location_name || "—"}</td>
                    <td className="text-right font-mono text-sm tabular-nums text-navy-500">
                      {r.min_qty}
                    </td>
                    <td className="text-right font-mono text-sm tabular-nums text-navy-500">
                      {r.max_qty}
                    </td>
                    <td className="text-right font-mono font-bold text-sm tabular-nums text-navy">
                      {r.current_stock}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingRule(r);
                            setFormData({
                              product_id: r.product_id,
                              location_id: r.location_id,
                              min_qty: r.min_qty,
                              max_qty: r.max_qty,
                            });
                          }}
                          title="Edit Rule"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-surface transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingRule(r)}
                          title="Delete Rule"
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
        title="Add Reorder Rule"
        description="Establish automated thresholds to monitor inventory stock levels."
        width="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              product_id: formData.product_id,
              location_id: formData.location_id,
              min_qty: Number(formData.min_qty),
              max_qty: Number(formData.max_qty),
            });
          }}
          className="space-y-4"
        >
          <FormField label="Product" required>
            <select
              required
              className="input-field"
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
            >
              <option value="" disabled>Select product</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Warehouse Location" required>
            <select
              required
              className="input-field"
              value={formData.location_id}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
            >
              <option value="" disabled>Select location</option>
              {locations?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.warehouse_name ? `${l.warehouse_name} - ` : ""}{l.name} ({l.code})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Minimum Quantity" required hint="Alert threshold">
              <input
                type="number"
                min="0"
                required
                className="input-field"
                value={formData.min_qty}
                onChange={(e) => setFormData({ ...formData, min_qty: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Maximum Quantity" required hint="Target capacity">
              <input
                type="number"
                min="1"
                required
                className="input-field"
                value={formData.max_qty}
                onChange={(e) => setFormData({ ...formData, max_qty: Number(e.target.value) })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Reorder Rule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingRule && (
        <Modal
          open={!!editingRule}
          onClose={() => setEditingRule(null)}
          title={`Edit Reorder Rule: ${editingRule.product_name}`}
          width="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingRule.id,
                data: {
                  min_qty: Number(formData.min_qty),
                  max_qty: Number(formData.max_qty),
                },
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Minimum Quantity" required>
                <input
                  type="number"
                  min="0"
                  required
                  className="input-field"
                  value={formData.min_qty}
                  onChange={(e) => setFormData({ ...formData, min_qty: Number(e.target.value) })}
                />
              </FormField>

              <FormField label="Maximum Quantity" required>
                <input
                  type="number"
                  min="1"
                  required
                  className="input-field"
                  value={formData.max_qty}
                  onChange={(e) => setFormData({ ...formData, max_qty: Number(e.target.value) })}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" type="button" onClick={() => setEditingRule(null)}>
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
      {deletingRule && (
        <ConfirmDialog
          open={!!deletingRule}
          onClose={() => setDeletingRule(null)}
          onConfirm={() => deleteMutation.mutate(deletingRule.id)}
          title="Delete Reorder Rule"
          description={`Are you sure you want to remove this reorder rule for "${deletingRule.product_name}"?`}
          confirmLabel="Delete Rule"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
