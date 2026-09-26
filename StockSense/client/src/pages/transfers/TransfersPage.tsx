import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  transfersApi,
  productsApi,
  locationsApi,
  Operation,
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
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  MapPin,
} from "lucide-react";

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Operation | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Form state
  const [sourceLocId, setSourceLocId] = useState("");
  const [destLocId, setDestLocId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([
    { product_id: "", quantity: 1 },
  ]);

  // Queries
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: transfersApi.list,
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
    mutationFn: transfersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Transfer order created");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create transfer");
    },
  });

  const validateMutation = useMutation({
    mutationFn: transfersApi.validate,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast.success(`Transfer ${updated.reference} validated! Stock moved.`);
      setSelectedTransfer(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to validate transfer");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: transfersApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Transfer canceled");
      setSelectedTransfer(null);
      setCancelingId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel transfer");
      setCancelingId(null);
    },
  });

  const resetForm = () => {
    setSourceLocId(locations?.[0]?.id || "");
    setDestLocId(locations?.[1]?.id || locations?.[0]?.id || "");
    setNotes("");
    setItems([{ product_id: products?.[0]?.id || "", quantity: 1 }]);
  };

  const handleOpenCreate = () => {
    resetForm();
    if (locations?.length) {
      setSourceLocId(locations[0].id);
      setDestLocId(locations[1]?.id || locations[0].id);
    }
    if (products?.length && (!items[0] || !items[0].product_id)) {
      setItems([{ product_id: products[0].id, quantity: 1 }]);
    }
    setIsCreateOpen(true);
  };

  const addItemRow = () => {
    setItems([...items, { product_id: products?.[0]?.id || "", quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: "product_id" | "quantity", val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  // Filter transfers
  const filteredTransfers = transfers?.filter((t) => {
    if (!statusFilter) return true;
    return t.status.toUpperCase() === statusFilter.toUpperCase();
  });

  const totalCount = transfers?.length ?? 0;
  const pendingCount = transfers?.filter((t) => t.status === "READY" || t.status === "WAITING" || t.status === "DRAFT").length ?? 0;
  const doneCount = transfers?.filter((t) => t.status === "DONE").length ?? 0;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Internal Stock Transfers"
        description="Transfer inventory between storage bins, racks, shelves, and warehouse facilities."
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            New Transfer
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Transfers"
          value={totalCount}
          icon={<ArrowLeftRight className="h-4 w-4" />}
          iconBg="bg-teal-50 text-teal-600"
        />
        <KPICard
          title="Pending / Scheduled"
          value={pendingCount}
          icon={<MapPin className="h-4 w-4" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPICard
          title="Completed Transfers"
          value={doneCount}
          icon={<CheckCircle className="h-4 w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl">
          {[
            { label: "All Transfers", val: "" },
            { label: "Ready / Scheduled", val: "READY" },
            { label: "Completed", val: "DONE" },
            { label: "Canceled", val: "CANCELED" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === tab.val
                  ? "bg-white text-navy shadow-sm"
                  : "text-navy-500 hover:text-navy"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-medium text-navy-400">
          {filteredTransfers?.length ?? 0} transfer{filteredTransfers?.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Transfers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={5} />
            </div>
          ) : !filteredTransfers?.length ? (
            <EmptyState
              icon={<ArrowLeftRight className="h-10 w-10" />}
              title="No transfers found"
              description="Move stock between internal locations to optimize warehouse layout."
              action={
                <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
                  Create First Transfer
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Source Location</th>
                  <th>Destination Location</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-navy">
                        {t.reference}
                      </span>
                    </td>
                    <td className="text-sm font-medium text-navy">
                      {t.source_location_name || "—"}
                    </td>
                    <td className="text-sm font-medium text-navy">
                      {t.destination_location_name || "—"}
                    </td>
                    <td className="text-sm text-navy-500">
                      {t.items.length} item{t.items.length !== 1 ? "s" : ""}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="text-xs text-navy-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTransfer(t)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-surface transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {t.status !== "DONE" && t.status !== "CANCELED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => validateMutation.mutate(t.id)}
                            loading={validateMutation.isPending}
                          >
                            Validate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Transfer Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Internal Stock Transfer"
        description="Move items from one warehouse location to another."
        width="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!sourceLocId || !destLocId) {
              toast.error("Please select both source and destination locations");
              return;
            }
            if (sourceLocId === destLocId) {
              toast.error("Source and destination locations must be different");
              return;
            }
            if (!items.length || items.some((it) => !it.product_id || it.quantity <= 0)) {
              toast.error("Please select products and valid quantities");
              return;
            }
            createMutation.mutate({
              source_location_id: sourceLocId,
              destination_location_id: destLocId,
              notes: notes.trim() || undefined,
              items: items.map((it) => ({
                product_id: it.product_id,
                quantity: Number(it.quantity),
              })),
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Source Location (From)" required>
              <select
                required
                className="input-field"
                value={sourceLocId}
                onChange={(e) => setSourceLocId(e.target.value)}
              >
                <option value="" disabled>Select origin location</option>
                {locations?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouse_name ? `${l.warehouse_name} - ` : ""}{l.name} ({l.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Destination Location (To)" required>
              <select
                required
                className="input-field"
                value={destLocId}
                onChange={(e) => setDestLocId(e.target.value)}
              >
                <option value="" disabled>Select destination location</option>
                {locations?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouse_name ? `${l.warehouse_name} - ` : ""}{l.name} ({l.code})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Notes / Reason">
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Replenishment to primary picking zone"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          {/* Line items */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400">
                Products to Move
              </h4>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item Line
              </button>
            </div>

            <div className="space-y-2">
              {items.map((row, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-surface p-2.5 rounded-xl">
                  <div className="flex-1">
                    <select
                      required
                      className="input-field text-sm"
                      value={row.product_id}
                      onChange={(e) => updateItemRow(idx, "product_id", e.target.value)}
                    >
                      <option value="" disabled>Select Product</option>
                      {products?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Total: {p.total_stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      className="input-field text-sm"
                      value={row.quantity}
                      onChange={(e) => updateItemRow(idx, "quantity", Number(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => removeItemRow(idx)}
                    className="p-2 text-navy-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Detail Modal */}
      {selectedTransfer && (
        <Modal
          open={!!selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
          title={`Transfer: ${selectedTransfer.reference}`}
          description={`Created ${new Date(selectedTransfer.created_at).toLocaleString()}`}
          width="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface p-4 rounded-xl">
              <div>
                <p className="text-xs text-navy-400">Source (From)</p>
                <p className="text-sm font-semibold text-navy mt-0.5">
                  {selectedTransfer.source_location_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400">Destination (To)</p>
                <p className="text-sm font-semibold text-navy mt-0.5">
                  {selectedTransfer.destination_location_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400">Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={selectedTransfer.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-navy-400">Validated At</p>
                <p className="text-sm font-medium text-navy-600 mt-0.5">
                  {selectedTransfer.validated_at
                    ? new Date(selectedTransfer.validated_at).toLocaleDateString()
                    : "Not validated"}
                </p>
              </div>
            </div>

            {selectedTransfer.notes && (
              <div className="text-xs text-navy-600 bg-slate-50 p-3 rounded-lg border border-border">
                <span className="font-semibold text-navy">Notes: </span>
                {selectedTransfer.notes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                Items to Move ({selectedTransfer.items.length})
              </h4>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransfer.items.map((it) => (
                      <tr key={it.id}>
                        <td className="font-medium text-navy text-sm">
                          {it.product_name || "Product"}
                        </td>
                        <td className="font-mono text-xs text-navy-500">{it.sku || "—"}</td>
                        <td className="text-right font-mono font-semibold text-navy text-sm tabular-nums">
                          {it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                {selectedTransfer.status !== "DONE" && selectedTransfer.status !== "CANCELED" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setCancelingId(selectedTransfer.id)}
                  >
                    Cancel Transfer
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setSelectedTransfer(null)}>
                  Close
                </Button>
                {selectedTransfer.status !== "DONE" && selectedTransfer.status !== "CANCELED" && (
                  <Button
                    variant="primary"
                    onClick={() => validateMutation.mutate(selectedTransfer.id)}
                    loading={validateMutation.isPending}
                  >
                    Validate & Complete Transfer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelingId && (
        <ConfirmDialog
          open={!!cancelingId}
          onClose={() => setCancelingId(null)}
          onConfirm={() => cancelMutation.mutate(cancelingId)}
          title="Cancel Transfer"
          description="Are you sure you want to cancel this transfer order?"
          confirmLabel="Yes, Cancel"
          variant="danger"
          loading={cancelMutation.isPending}
        />
      )}
    </div>
  );
}
