import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ledgerApi, warehousesApi, LedgerEntry } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge, EmptyState, LoadingState, KPICard } from "../../components/ui";
import {
  History,
  Search,
  ArrowDownCircle,
  Truck,
  ArrowLeftRight,
  ClipboardList,
  Filter,
} from "lucide-react";

export default function LedgerPage() {
  const [search, setSearch] = useState("");
  const [opType, setOpType] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.list,
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["ledger", { search, operation_type: opType, warehouse_id: warehouseId }],
    queryFn: () =>
      ledgerApi.list({
        search: search || undefined,
        operation_type: opType || undefined,
        warehouse_id: warehouseId || undefined,
        limit: 100,
      }),
  });

  const totalMoves = entries?.length ?? 0;
  const receiptsCount = entries?.filter((e) => e.operation_type === "RECEIPT").length ?? 0;
  const deliveriesCount = entries?.filter((e) => e.operation_type === "DELIVERY").length ?? 0;
  const transfersCount = entries?.filter((e) => e.operation_type === "TRANSFER").length ?? 0;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Stock Move History & Audit Ledger"
        description="Immutable audit trail of all physical and logical inventory transactions."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Recorded Transactions"
          value={totalMoves}
          icon={<History className="h-4 w-4" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="Inbound Receipts"
          value={receiptsCount}
          icon={<ArrowDownCircle className="h-4 w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KPICard
          title="Outbound Deliveries"
          value={deliveriesCount}
          icon={<Truck className="h-4 w-4" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <KPICard
          title="Internal Transfers"
          value={transfersCount}
          icon={<ArrowLeftRight className="h-4 w-4" />}
          iconBg="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search reference, product, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-full text-sm"
            />
          </div>

          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="input-field text-sm w-48"
          >
            <option value="">All Warehouses</option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Op type buttons */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl overflow-x-auto w-full md:w-auto">
          {[
            { label: "All Types", val: "" },
            { label: "Receipts", val: "RECEIPT" },
            { label: "Deliveries", val: "DELIVERY" },
            { label: "Transfers", val: "TRANSFER" },
            { label: "Adjustments", val: "ADJUSTMENT" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setOpType(tab.val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                opType === tab.val
                  ? "bg-white text-navy shadow-sm"
                  : "text-navy-500 hover:text-navy"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={6} />
            </div>
          ) : !entries?.length ? (
            <EmptyState
              icon={<History className="h-10 w-10" />}
              title="No ledger entries found"
              description="Inventory transactions and stock movements will automatically log here."
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Product & SKU</th>
                  <th className="text-right">Change</th>
                  <th className="text-right">Balance</th>
                  <th>Locations (From → To)</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: LedgerEntry) => {
                  const isPositive = e.quantity_change > 0;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="text-xs text-navy-400 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <span className="font-mono text-xs font-semibold text-navy">
                          {e.reference || "—"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={e.operation_type} />
                      </td>
                      <td>
                        <p className="font-medium text-navy text-sm">{e.product_name || "Product"}</p>
                        {e.sku && <p className="font-mono text-[11px] text-navy-400">{e.sku}</p>}
                      </td>
                      <td className="text-right font-mono font-bold text-sm tabular-nums">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded"
                              : "text-red-600 bg-red-50 px-2 py-0.5 rounded"
                          }
                        >
                          {isPositive ? `+${e.quantity_change}` : e.quantity_change}
                        </span>
                      </td>
                      <td className="text-right font-mono text-navy font-semibold text-sm tabular-nums">
                        {e.balance_after}
                      </td>
                      <td className="text-xs text-navy-600">
                        {e.source_location_name && e.destination_location_name ? (
                          <span>
                            {e.source_location_name} → {e.destination_location_name}
                          </span>
                        ) : e.source_location_name ? (
                          <span>From: {e.source_location_name}</span>
                        ) : e.destination_location_name ? (
                          <span>To: {e.destination_location_name}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-xs text-navy-500">{e.created_by_name || "System"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
