import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  receiptsApi,
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
  ArrowDownCircle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Package,
  Building,
} from "lucide-react";

export default function ReceiptsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Operation | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Form state
  const [partnerName, setPartnerName] = useState("");
  const [destLocationId, setDestLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([
    { product_id: "", quantity: 1 },
  ]);

  // Queries
  const { data: receipts, isLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: receiptsApi.list,
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
    mutationFn: receiptsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Receipt created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create receipt");
    },
  });

  const validateMutation = useMutation({
    mutationFn: receiptsApi.validate,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast.success(`Receipt ${updated.reference} validated! Stock updated.`);
      setSelectedReceipt(null);
      setValidatingId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to validate receipt");
      setValidatingId(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: receiptsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Receipt canceled");
      setSelectedReceipt(null);
      setCancelingId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel receipt");
      setCancelingId(null);
    },
  });

  const resetForm = () => {
    setPartnerName("");
    setDestLocationId(locations?.[0]?.id || "");
    setNotes("");
    setItems([{ product_id: products?.[0]?.id || "", quantity: 1 }]);
  };

  const handleOpenCreate = () => {
    resetForm();
    if (locations?.length && !destLocationId) {
      setDestLocationId(locations[0].id);
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

  // Filter receipts
  const filteredReceipts = receipts?.filter((r) => {
    if (!statusFilter) return true;
    return r.status.toUpperCase() === statusFilter.toUpperCase();
  });

  const totalCount = receipts?.length ?? 0;
  const pendingCount = receipts?.filter((r) => r.status === "READY" || r.status === "WAITING" || r.status === "DRAFT").length ?? 0;
  const doneCount = receipts?.filter((r) => r.status === "DONE").length ?? 0;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Incoming Receipts"
        description="Receive incoming stock from suppliers and vendors into warehouse storage locations."
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            New Receipt
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Receipts"
          value={totalCount}
          icon={<ArrowDownCircle className="h-4 w-4" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="Pending Validation"
          value={pendingCount}
          icon={<Package className="h-4 w-4" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPICard
          title="Completed Receipts"
          value={doneCount}
          icon={<CheckCircle className="h-4 w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl">
          {[
            { label: "All Receipts", val: "" },
            { label: "Ready / Pending", val: "READY" },
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
          {filteredReceipts?.length ?? 0} receipt{filteredReceipts?.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Receipts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={5} />
            </div>
          ) : !filteredReceipts?.length ? (
            <EmptyState
              icon={<ArrowDownCircle className="h-10 w-10" />}
              title="No receipts found"
              description="Record incoming shipments from suppliers to increase inventory stock."
              action={
                <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
                  Create First Receipt
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Supplier / Partner</th>
                  <th>Destination Location</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-navy">
                        {r.reference}
                      </span>
                    </td>
                    <td className="font-medium text-navy text-sm">
                      {r.partner_name || "—"}
                    </td>
                    <td className="text-sm text-navy-600">
                      {r.destination_location_name || "—"}
                    </td>
                    <td className="text-sm text-navy-500">
                      {r.items.length} item{r.items.length !== 1 ? "s" : ""}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-xs text-navy-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReceipt(r)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-surface transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {r.status !== "DONE" && r.status !== "CANCELED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => validateMutation.mutate(r.id)}
                            loading={validateMutation.isPending && validatingId === r.id}
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

      {/* Create Receipt Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Inbound Receipt"
        description="Receive products from a supplier into your warehouse."
        width="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!destLocationId) {
              toast.error("Please select a destination location");
              return;
            }
            if (!items.length || items.some((it) => !it.product_id || it.quantity <= 0)) {
              toast.error("Please complete all item lines with valid quantities");
              return;
            }
            createMutation.mutate({
              partner_name: partnerName.trim() || "Supplier",
              destination_location_id: destLocationId,
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
            <FormField label="Supplier / Vendor Name" required>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Apex Industrial Supplies"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
              />
            </FormField>

            <FormField label="Destination Storage Location" required>
              <select
                required
                className="input-field"
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
              >
                <option value="" disabled>Select location</option>
                {locations?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouse_name ? `${l.warehouse_name} - ` : ""}{l.name} ({l.code})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Notes / Reference Details">
            <input
              type="text"
              className="input-field"
              placeholder="e.g. PO #84920, Delivered via FedEx"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          {/* Line items */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400">
                Products to Receive
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
                          {p.name} ({p.sku})
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
              Create Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <Modal
          open={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Receipt: ${selectedReceipt.reference}`}
          description={`Created ${new Date(selectedReceipt.created_at).toLocaleString()}`}
          width="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface p-4 rounded-xl">
              <div>
                <p className="text-xs text-navy-400">Supplier</p>
                <p className="text-sm font-semibold text-navy mt-0.5">
                  {selectedReceipt.partner_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400">Destination</p>
                <p className="text-sm font-semibold text-navy mt-0.5">
                  {selectedReceipt.destination_location_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400">Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={selectedReceipt.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-navy-400">Validated At</p>
                <p className="text-sm font-medium text-navy-600 mt-0.5">
                  {selectedReceipt.validated_at
                    ? new Date(selectedReceipt.validated_at).toLocaleDateString()
                    : "Not validated"}
                </p>
              </div>
            </div>

            {selectedReceipt.notes && (
              <div className="text-xs text-navy-600 bg-slate-50 p-3 rounded-lg border border-border">
                <span className="font-semibold text-navy">Notes: </span>
                {selectedReceipt.notes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                Shipment Items ({selectedReceipt.items.length})
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
                    {selectedReceipt.items.map((it) => (
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
                {selectedReceipt.status !== "DONE" && selectedReceipt.status !== "CANCELED" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setCancelingId(selectedReceipt.id);
                    }}
                  >
                    Cancel Receipt
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setSelectedReceipt(null)}>
                  Close
                </Button>
                {selectedReceipt.status !== "DONE" && selectedReceipt.status !== "CANCELED" && (
                  <Button
                    variant="primary"
                    onClick={() => validateMutation.mutate(selectedReceipt.id)}
                    loading={validateMutation.isPending}
                  >
                    Validate & Receive Stock
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
          title="Cancel Receipt"
          description="Are you sure you want to cancel this receipt? It will be marked as canceled and will not alter stock levels."
          confirmLabel="Yes, Cancel Receipt"
          variant="danger"
          loading={cancelMutation.isPending}
        />
      )}
    </div>
  );
}
