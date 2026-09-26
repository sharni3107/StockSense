import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  deliveriesApi,
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
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  PackageCheck,
  Send,
  Boxes,
} from "lucide-react";

export default function DeliveriesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Operation | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([
    { product_id: "", quantity: 1 },
  ]);

  // Picking quantity per item
  const [pickQtyMap, setPickQtyMap] = useState<Record<string, number>>({});

  // Queries
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: deliveriesApi.list,
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
    mutationFn: deliveriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Delivery order created");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create delivery order");
    },
  });

  const pickMutation = useMutation({
    mutationFn: ({ id, itemId, qty }: { id: string; itemId: string; qty: number }) =>
      deliveriesApi.pick(id, itemId, qty),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Items picked successfully");
      setSelectedDelivery(updated);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record pick");
    },
  });

  const packMutation = useMutation({
    mutationFn: (id: string) => deliveriesApi.pack(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Delivery packed and ready for shipping!");
      setSelectedDelivery(updated);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to pack delivery");
    },
  });

  const validateMutation = useMutation({
    mutationFn: deliveriesApi.validate,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast.success(`Delivery ${updated.reference} validated! Stock deducted.`);
      setSelectedDelivery(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to validate delivery order");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: deliveriesApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Delivery order canceled");
      setSelectedDelivery(null);
      setCancelingId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel delivery order");
      setCancelingId(null);
    },
  });

  const resetForm = () => {
    setCustomerName("");
    setSourceLocationId(locations?.[0]?.id || "");
    setNotes("");
    setItems([{ product_id: products?.[0]?.id || "", quantity: 1 }]);
  };

  const handleOpenCreate = () => {
    resetForm();
    if (locations?.length && !sourceLocationId) {
      setSourceLocationId(locations[0].id);
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

  // Filter deliveries
  const filteredDeliveries = deliveries?.filter((d) => {
    if (!statusFilter) return true;
    return d.status.toUpperCase() === statusFilter.toUpperCase();
  });

  const totalCount = deliveries?.length ?? 0;
  const pendingCount = deliveries?.filter((d) => d.status === "READY" || d.status === "WAITING" || d.status === "DRAFT").length ?? 0;
  const doneCount = deliveries?.filter((d) => d.status === "DONE").length ?? 0;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Outgoing Delivery Orders"
        description="Pick, pack, and fulfill outgoing shipments to customers and partners."
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            New Delivery Order
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Orders"
          value={totalCount}
          icon={<Truck className="h-4 w-4" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <KPICard
          title="Fulfillment in Progress"
          value={pendingCount}
          icon={<Boxes className="h-4 w-4" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPICard
          title="Shipped & Delivered"
          value={doneCount}
          icon={<CheckCircle className="h-4 w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl">
          {[
            { label: "All Orders", val: "" },
            { label: "Ready / In Progress", val: "READY" },
            { label: "Shipped / Done", val: "DONE" },
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
          {filteredDeliveries?.length ?? 0} order{filteredDeliveries?.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Deliveries Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={5} />
            </div>
          ) : !filteredDeliveries?.length ? (
            <EmptyState
              icon={<Truck className="h-10 w-10" />}
              title="No delivery orders"
              description="Create a delivery order to fulfill customer requests from your warehouse."
              action={
                <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
                  Create First Delivery
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer / Recipient</th>
                  <th>Source Location</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-navy">
                        {d.reference}
                      </span>
                    </td>
                    <td className="font-medium text-navy text-sm">
                      {d.partner_name || "—"}
                    </td>
                    <td className="text-sm text-navy-600">
                      {d.source_location_name || "—"}
                    </td>
                    <td className="text-sm text-navy-500">
                      {d.items.length} item{d.items.length !== 1 ? "s" : ""}
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="text-xs text-navy-400">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedDelivery(d)}
                          icon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Fulfill
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Delivery Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Outgoing Delivery Order"
        description="Fulfill customer order from available stock."
        width="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!sourceLocationId) {
              toast.error("Please select a source storage location");
              return;
            }
            if (!items.length || items.some((it) => !it.product_id || it.quantity <= 0)) {
              toast.error("Please select products and valid quantities");
              return;
            }
            createMutation.mutate({
              partner_name: customerName.trim() || "Customer",
              source_location_id: sourceLocationId,
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
            <FormField label="Customer / Recipient Name" required>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Global Tech Logistics"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </FormField>

            <FormField label="Source Storage Location" required>
              <select
                required
                className="input-field"
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
              >
                <option value="" disabled>Select source location</option>
                {locations?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouse_name ? `${l.warehouse_name} - ` : ""}{l.name} ({l.code})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Notes / Tracking Info">
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Expedited Shipping, Order #9021"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          {/* Line items */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400">
                Products to Fulfill
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
                          {p.name} ({p.sku}) — Avail: {p.total_stock}
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
              Create Delivery Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fulfill / Detail Modal */}
      {selectedDelivery && (
        <Modal
          open={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          title={`Delivery: ${selectedDelivery.reference}`}
          description={`Customer: ${selectedDelivery.partner_name || "—"} • From: ${selectedDelivery.source_location_name || "—"}`}
          width="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface p-4 rounded-xl">
              <div>
                <p className="text-xs text-navy-400">Recipient</p>
                <p className="text-sm font-semibold text-navy mt-0.5">
                  {selectedDelivery.partner_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400">Source Location</p>
                <p className="text-sm font-semibold text-navy mt-0.5">
                  {selectedDelivery.source_location_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400">Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={selectedDelivery.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-navy-400">Date Created</p>
                <p className="text-sm font-medium text-navy-600 mt-0.5">
                  {new Date(selectedDelivery.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Picking items */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                Order Items & Picking Progress
              </h4>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="text-right">Requested</th>
                      <th className="text-right">Picked</th>
                      {selectedDelivery.status !== "DONE" && selectedDelivery.status !== "CANCELED" && (
                        <th className="text-right">Pick Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDelivery.items.map((it) => {
                      const isFullyPicked = it.processed_quantity >= it.quantity;
                      return (
                        <tr key={it.id}>
                          <td className="font-medium text-navy text-sm">
                            {it.product_name || "Product"}
                          </td>
                          <td className="font-mono text-xs text-navy-500">{it.sku || "—"}</td>
                          <td className="text-right font-mono font-semibold text-navy text-sm tabular-nums">
                            {it.quantity}
                          </td>
                          <td className="text-right font-mono text-sm tabular-nums">
                            <span className={isFullyPicked ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                              {it.processed_quantity} / {it.quantity}
                            </span>
                          </td>
                          {selectedDelivery.status !== "DONE" && selectedDelivery.status !== "CANCELED" && (
                            <td className="text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <input
                                  type="number"
                                  min="1"
                                  max={it.quantity}
                                  placeholder={String(it.quantity)}
                                  className="input-field text-xs w-20 py-1"
                                  value={pickQtyMap[it.id] ?? it.quantity}
                                  onChange={(e) =>
                                    setPickQtyMap({ ...pickQtyMap, [it.id]: Number(e.target.value) })
                                  }
                                />
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    pickMutation.mutate({
                                      id: selectedDelivery.id,
                                      itemId: it.id,
                                      qty: pickQtyMap[it.id] ?? it.quantity,
                                    })
                                  }
                                  loading={pickMutation.isPending}
                                >
                                  Pick
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                {selectedDelivery.status !== "DONE" && selectedDelivery.status !== "CANCELED" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setCancelingId(selectedDelivery.id)}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setSelectedDelivery(null)}>
                  Close
                </Button>
                {selectedDelivery.status !== "DONE" && selectedDelivery.status !== "CANCELED" && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => packMutation.mutate(selectedDelivery.id)}
                      loading={packMutation.isPending}
                      icon={<PackageCheck className="h-4 w-4" />}
                    >
                      Pack Order
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => validateMutation.mutate(selectedDelivery.id)}
                      loading={validateMutation.isPending}
                      icon={<Send className="h-4 w-4" />}
                    >
                      Validate & Ship
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation */}
      {cancelingId && (
        <ConfirmDialog
          open={!!cancelingId}
          onClose={() => setCancelingId(null)}
          onConfirm={() => cancelMutation.mutate(cancelingId)}
          title="Cancel Delivery Order"
          description="Are you sure you want to cancel this delivery order? Any picked items will remain untouched."
          confirmLabel="Yes, Cancel Order"
          variant="danger"
          loading={cancelMutation.isPending}
        />
      )}
    </div>
  );
}
