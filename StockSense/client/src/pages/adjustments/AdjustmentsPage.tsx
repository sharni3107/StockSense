import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  adjustmentsApi,
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
import { Modal } from "../../components/ui/Modal";
import {
  Plus,
  ClipboardList,
  CheckCircle,
  Eye,
  Trash2,
  Scale,
} from "lucide-react";

export default function AdjustmentsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<Operation | null>(null);

  // Form state
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<
    { product_id: string; location_id: string; physical_quantity: number }[]
  >([{ product_id: "", location_id: "", physical_quantity: 0 }]);

  // Queries
  const { data: adjustments, isLoading } = useQuery({
    queryKey: ["adjustments"],
    queryFn: adjustmentsApi.list,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsApi.list(),
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: adjustmentsApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast.success(`Adjustment ${res.reference} applied! Stock balances synchronized.`);
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record adjustment");
    },
  });

  const resetForm = () => {
    setNotes("");
    setLines([
      {
        product_id: products?.[0]?.id || "",
        location_id: locations?.[0]?.id || "",
        physical_quantity: 0,
      },
    ]);
  };

  const handleOpenCreate = () => {
    resetForm();
    if (products?.length && locations?.length) {
      setLines([
        {
          product_id: products[0].id,
          location_id: locations[0].id,
          physical_quantity: 0,
        },
      ]);
    }
    setIsCreateOpen(true);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_id: products?.[0]?.id || "",
        location_id: locations?.[0]?.id || "",
        physical_quantity: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, val: any) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: val };
    setLines(next);
  };

  const totalCount = adjustments?.length ?? 0;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Inventory Adjustments & Stock Counts"
        description="Reconcile physical inventory counts and correct discrepancy variances."
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            New Stock Adjustment
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          title="Total Reconciliations"
          value={totalCount}
          icon={<ClipboardList className="h-4 w-4" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPICard
          title="Audit Trail Status"
          value="Synchronized"
          icon={<CheckCircle className="h-4 w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Adjustments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={5} />
            </div>
          ) : !adjustments?.length ? (
            <EmptyState
              icon={<Scale className="h-10 w-10" />}
              title="No adjustments recorded"
              description="Record physical cycle counts to calibrate on-hand inventory levels."
              action={
                <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
                  Perform First Stock Count
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Reason / Notes</th>
                  <th>Items Adjusted</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-navy">
                        {a.reference}
                      </span>
                    </td>
                    <td className="text-sm text-navy-600">{a.notes || "Physical stock count"}</td>
                    <td className="text-sm text-navy-500">
                      {a.items.length} product{a.items.length !== 1 ? "s" : ""}
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="text-xs text-navy-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedAdjustment(a)}
                        icon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Adjustment Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Inventory Adjustment"
        description="Specify counted physical inventory to synchronize system balances."
        width="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !lines.length ||
              lines.some((l) => !l.product_id || !l.location_id || l.physical_quantity < 0)
            ) {
              toast.error("Please complete all adjustment lines with valid product, location, and non-negative quantity");
              return;
            }
            createMutation.mutate({
              notes: notes.trim() || "Physical count correction",
              lines: lines.map((l) => ({
                product_id: l.product_id,
                location_id: l.location_id,
                physical_quantity: Number(l.physical_quantity),
              })),
            });
          }}
          className="space-y-4"
        >
          <FormField label="Reason / Audit Note">
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Annual physical count, Damaged goods write-off"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          {/* Adjustment Lines */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400">
                Physical Inventory Counts
              </h4>
              <button
                type="button"
                onClick={addLine}
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Line
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface p-3 rounded-xl items-center"
                >
                  <div className="md:col-span-5">
                    <label className="text-[11px] font-semibold text-navy-400 block mb-1">
                      Product
                    </label>
                    <select
                      required
                      className="input-field text-sm"
                      value={line.product_id}
                      onChange={(e) => updateLine(idx, "product_id", e.target.value)}
                    >
                      <option value="" disabled>Select product</option>
                      {products?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-[11px] font-semibold text-navy-400 block mb-1">
                      Location
                    </label>
                    <select
                      required
                      className="input-field text-sm"
                      value={line.location_id}
                      onChange={(e) => updateLine(idx, "location_id", e.target.value)}
                    >
                      <option value="" disabled>Select location</option>
                      {locations?.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.warehouse_name ? `${l.warehouse_name} - ` : ""}{l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-navy-400 block mb-1">
                      Counted Qty
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="input-field text-sm"
                      value={line.physical_quantity}
                      onChange={(e) =>
                        updateLine(idx, "physical_quantity", Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center pt-5">
                    <button
                      type="button"
                      disabled={lines.length <= 1}
                      onClick={() => removeLine(idx)}
                      className="p-1.5 text-navy-400 hover:text-red-500 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Apply Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment Detail Modal */}
      {selectedAdjustment && (
        <Modal
          open={!!selectedAdjustment}
          onClose={() => setSelectedAdjustment(null)}
          title={`Adjustment: ${selectedAdjustment.reference}`}
          description={`Recorded on ${new Date(selectedAdjustment.created_at).toLocaleString()}`}
          width="md"
        >
          <div className="space-y-4">
            <div className="bg-surface p-4 rounded-xl">
              <p className="text-xs text-navy-400">Notes / Reason</p>
              <p className="text-sm font-medium text-navy mt-1">
                {selectedAdjustment.notes || "Physical stock count"}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-2">
                Adjusted Lines
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
                    {selectedAdjustment.items.map((it) => (
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

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedAdjustment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
