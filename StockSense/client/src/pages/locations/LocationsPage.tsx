import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { locationsApi, warehousesApi, Location } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { EmptyState, LoadingState } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Plus, MapPin, Building, Edit2, Trash2 } from "lucide-react";

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    warehouse_id: "",
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.list,
  });

  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations", selectedWarehouse],
    queryFn: () => locationsApi.list(selectedWarehouse || undefined),
  });

  const createMutation = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Location created successfully");
      setIsCreateOpen(false);
      setFormData({ name: "", code: "", warehouse_id: warehouses?.[0]?.id || "" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create location");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => locationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location updated successfully");
      setEditingLocation(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update location");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: locationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Location deleted successfully");
      setDeletingLocation(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete location");
    },
  });

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      code: "",
      warehouse_id: selectedWarehouse || warehouses?.[0]?.id || "",
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Warehouse Storage Locations"
        description="Aisles, racks, bins, shelves, and storage zones within your warehouses."
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            Add Location
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-navy-400">
            Warehouse Filter:
          </label>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="input-field text-sm w-56"
          >
            <option value="">All Warehouses</option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-medium text-navy-400">
          {locations?.length ?? 0} location{locations?.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Locations Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={5} />
            </div>
          ) : !locations?.length ? (
            <EmptyState
              icon={<MapPin className="h-10 w-10" />}
              title="No locations found"
              description="Create storage locations like racks, shelves, or zones."
              action={
                <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
                  Add Location
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Location Name</th>
                  <th>Location Code</th>
                  <th>Warehouse</th>
                  <th className="text-right">Products Stored</th>
                  <th className="text-right">Total Units</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-navy text-sm">{loc.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-navy-600 bg-surface px-2 py-0.5 rounded border border-border">
                        {loc.code}
                      </span>
                    </td>
                    <td className="text-sm text-navy-600 font-medium">
                      {loc.warehouse_name || "—"}
                    </td>
                    <td className="text-right font-medium text-navy text-sm tabular-nums">
                      {loc.product_count} product{loc.product_count !== 1 ? "s" : ""}
                    </td>
                    <td className="text-right font-semibold text-navy text-sm tabular-nums">
                      {loc.total_units.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingLocation(loc);
                            setFormData({
                              name: loc.name,
                              code: loc.code,
                              warehouse_id: loc.warehouse_id,
                            });
                          }}
                          title="Edit Location"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-surface transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingLocation(loc)}
                          title="Delete Location"
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
        title="Add Storage Location"
        description="Define a new bin, aisle, shelf, or zone in a warehouse."
        width="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <FormField label="Warehouse" required>
            <select
              required
              className="input-field"
              value={formData.warehouse_id}
              onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
            >
              <option value="" disabled>Select warehouse</option>
              {warehouses?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Location Name" required>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Aisle 3 - Shelf B"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField label="Location Code" required hint="Short code (e.g. A3-SB)">
            <input
              type="text"
              required
              className="input-field uppercase font-mono"
              placeholder="e.g. A3-SB"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Location
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingLocation && (
        <Modal
          open={!!editingLocation}
          onClose={() => setEditingLocation(null)}
          title={`Edit Location: ${editingLocation.name}`}
          width="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingLocation.id,
                data: { name: formData.name, code: formData.code },
              });
            }}
            className="space-y-4"
          >
            <FormField label="Location Name" required>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Location Code" required>
              <input
                type="text"
                required
                className="input-field uppercase font-mono"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" type="button" onClick={() => setEditingLocation(null)}>
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
      {deletingLocation && (
        <ConfirmDialog
          open={!!deletingLocation}
          onClose={() => setDeletingLocation(null)}
          onConfirm={() => deleteMutation.mutate(deletingLocation.id)}
          title="Delete Location"
          description={`Are you sure you want to delete "${deletingLocation.name}" (${deletingLocation.code})? This location must have 0 units stored before deletion.`}
          confirmLabel="Delete Location"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
