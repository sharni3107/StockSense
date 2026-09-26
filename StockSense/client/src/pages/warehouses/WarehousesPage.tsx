import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { warehousesApi, Warehouse } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { EmptyState, LoadingState } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Plus, Warehouse as WarehouseIcon, MapPin, Edit2, Trash2, Building } from "lucide-react";

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
  });

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: warehousesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Warehouse created successfully");
      setIsCreateOpen(false);
      setFormData({ name: "", code: "", address: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create warehouse");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => warehousesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Warehouse updated successfully");
      setEditingWarehouse(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update warehouse");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: warehousesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Warehouse deleted successfully");
      setDeletingWarehouse(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete warehouse");
    },
  });

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Warehouses & Facilities"
        description="Manage your physical buildings, fulfillment centers, and storage facilities."
        actions={
          <Button
            onClick={() => {
              setFormData({ name: "", code: "", address: "" });
              setIsCreateOpen(true);
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Warehouse
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={4} />
            </div>
          ) : !warehouses?.length ? (
            <EmptyState
              icon={<WarehouseIcon className="h-10 w-10" />}
              title="No warehouses configured"
              description="Create a warehouse to begin tracking storage zones and locations."
              action={
                <Button
                  onClick={() => {
                    setFormData({ name: "", code: "", address: "" });
                    setIsCreateOpen(true);
                  }}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add Warehouse
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Warehouse</th>
                  <th>Facility Code</th>
                  <th>Address</th>
                  <th className="text-right">Locations</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                          <Building className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-navy text-sm">{w.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-navy-600 bg-surface px-2 py-0.5 rounded border border-border">
                        {w.code}
                      </span>
                    </td>
                    <td className="text-sm text-navy-500">{w.address || "—"}</td>
                    <td className="text-right font-medium text-navy text-sm tabular-nums">
                      {w.location_count} location{w.location_count !== 1 ? "s" : ""}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingWarehouse(w);
                            setFormData({ name: w.name, code: w.code, address: w.address || "" });
                          }}
                          title="Edit Warehouse"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-surface transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingWarehouse(w)}
                          title="Delete Warehouse"
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
        title="Add New Warehouse"
        description="Register a new building or distribution center."
        width="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <FormField label="Warehouse Name" required>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Central Fulfillment Hub"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField label="Warehouse Code" required hint="Short unique code (e.g. WH-MAIN)">
            <input
              type="text"
              required
              className="input-field uppercase font-mono"
              placeholder="e.g. WH-MAIN"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </FormField>

          <FormField label="Physical Address">
            <textarea
              rows={2}
              className="input-field"
              placeholder="Street, City, State, Postal Code"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Warehouse
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingWarehouse && (
        <Modal
          open={!!editingWarehouse}
          onClose={() => setEditingWarehouse(null)}
          title={`Edit Warehouse: ${editingWarehouse.name}`}
          width="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingWarehouse.id,
                data: { name: formData.name, address: formData.address },
              });
            }}
            className="space-y-4"
          >
            <FormField label="Warehouse Name" required>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Physical Address">
              <textarea
                rows={2}
                className="input-field"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" type="button" onClick={() => setEditingWarehouse(null)}>
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
      {deletingWarehouse && (
        <ConfirmDialog
          open={!!deletingWarehouse}
          onClose={() => setDeletingWarehouse(null)}
          onConfirm={() => deleteMutation.mutate(deletingWarehouse.id)}
          title="Delete Warehouse"
          description={`Are you sure you want to delete "${deletingWarehouse.name}"? Locations and stock tied to this warehouse must be moved first.`}
          confirmLabel="Delete Warehouse"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
