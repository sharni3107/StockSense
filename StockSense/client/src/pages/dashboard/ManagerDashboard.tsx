import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { dashboardApi, Operation, Product } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { KPICard, StatusBadge, EmptyState, LoadingState } from "../../components/ui";
import {
  Package, AlertTriangle, XCircle, ArrowDownCircle,
  Truck, ArrowLeftRight, TrendingUp, Clock
} from "lucide-react";

// ─── Manager Dashboard ────────────────────────────────────────────────────────
export function ManagerDashboard() {
  const navigate = useNavigate();
  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: dashboardApi.summary,
    refetchInterval: 30000,
  });
  const { data: lowStock, isLoading: lowLoading } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: dashboardApi.lowStock,
  });
  const { data: pendingReceipts, isLoading: recLoading } = useQuery({
    queryKey: ["dashboard-pending-receipts"],
    queryFn: dashboardApi.pendingReceipts,
  });
  const { data: pendingDeliveries, isLoading: delLoading } = useQuery({
    queryKey: ["dashboard-pending-deliveries"],
    queryFn: dashboardApi.pendingDeliveries,
  });
  const { data: activity, isLoading: actLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: dashboardApi.activity,
  });

  return (
    <div className="space-y-8 animate-in">
      <PageHeader
        title="Inventory Dashboard"
        description="Monitor stock levels and warehouse operations."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {sumLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="kpi-card h-28 bg-surface animate-pulse" />
          ))
        ) : (
          <>
            <KPICard
              title="Total Products"
              value={summary?.total_stock_units?.toLocaleString() ?? 0}
              icon={<Package className="h-4 w-4" />}
              iconBg="bg-primary-50 text-primary"
              link={{ label: "View products", onClick: () => navigate("/products") }}
            />
            <KPICard
              title="Low Stock Items"
              value={summary?.low_stock_count ?? 0}
              icon={<AlertTriangle className="h-4 w-4" />}
              iconBg="bg-amber-50 text-amber-600"
            />
            <KPICard
              title="Out of Stock"
              value={summary?.out_of_stock_count ?? 0}
              icon={<XCircle className="h-4 w-4" />}
              iconBg="bg-red-50 text-red-500"
            />
            <KPICard
              title="Pending Receipts"
              value={summary?.pending_receipts ?? 0}
              icon={<ArrowDownCircle className="h-4 w-4" />}
              iconBg="bg-blue-50 text-blue-600"
              link={{ label: "View receipts", onClick: () => navigate("/receipts") }}
            />
            <KPICard
              title="Pending Deliveries"
              value={summary?.pending_deliveries ?? 0}
              icon={<Truck className="h-4 w-4" />}
              iconBg="bg-purple-50 text-purple-600"
              link={{ label: "View deliveries", onClick: () => navigate("/deliveries") }}
            />
            <KPICard
              title="Scheduled Transfers"
              value={summary?.scheduled_transfers ?? 0}
              icon={<ArrowLeftRight className="h-4 w-4" />}
              iconBg="bg-teal-50 text-teal-600"
              link={{ label: "View transfers", onClick: () => navigate("/transfers") }}
            />
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-heading-sm font-semibold text-navy">Low Stock Items</h2>
              <p className="text-xs text-navy-400 mt-0.5">Products below reorder level</p>
            </div>
            <button onClick={() => navigate("/products?status=low")} className="text-xs text-primary hover:underline font-medium">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            {lowLoading ? (
              <div className="p-5"><LoadingState rows={4} /></div>
            ) : !lowStock?.length ? (
              <EmptyState
                icon={<TrendingUp className="h-8 w-8" />}
                title="All stock levels healthy"
                description="No products below their reorder level."
              />
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Available</th>
                    <th className="text-right">Reorder Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 8).map((p: Product) => (
                    <tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                      <td className="font-medium text-navy">{p.name}</td>
                      <td className="text-navy-400 font-mono text-xs">{p.sku}</td>
                      <td className="text-right tabular-nums">{p.total_stock} {p.unit}</td>
                      <td className="text-right tabular-nums text-navy-400">{p.reorder_level}</td>
                      <td><StatusBadge status={p.stock_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Pending Receipts */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-heading-sm font-semibold text-navy">Pending Receipts</h2>
              <p className="text-xs text-navy-400 mt-0.5">Incoming stock awaiting validation</p>
            </div>
            <button onClick={() => navigate("/receipts")} className="text-xs text-primary hover:underline font-medium">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            {recLoading ? (
              <div className="p-5"><LoadingState rows={4} /></div>
            ) : !pendingReceipts?.length ? (
              <EmptyState
                icon={<ArrowDownCircle className="h-8 w-8" />}
                title="No pending receipts"
                description="All receipts are processed."
              />
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReceipts.slice(0, 8).map((op: Operation) => (
                    <tr key={op.id} className="cursor-pointer" onClick={() => navigate(`/receipts`)}>
                      <td className="font-mono text-xs text-navy font-semibold">{op.reference}</td>
                      <td className="text-navy-600">{op.partner_name || "—"}</td>
                      <td><StatusBadge status={op.status} /></td>
                      <td className="text-navy-400">{op.items.length} item{op.items.length !== 1 ? "s" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Pending Deliveries */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-heading-sm font-semibold text-navy">Pending Deliveries</h2>
              <p className="text-xs text-navy-400 mt-0.5">Outgoing orders in progress</p>
            </div>
            <button onClick={() => navigate("/deliveries")} className="text-xs text-primary hover:underline font-medium">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            {delLoading ? (
              <div className="p-5"><LoadingState rows={4} /></div>
            ) : !pendingDeliveries?.length ? (
              <EmptyState
                icon={<Truck className="h-8 w-8" />}
                title="No pending deliveries"
                description="No outgoing orders in progress."
              />
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeliveries.slice(0, 8).map((op: Operation) => (
                    <tr key={op.id} className="cursor-pointer" onClick={() => navigate("/deliveries")}>
                      <td className="font-mono text-xs text-navy font-semibold">{op.reference}</td>
                      <td className="text-navy-600">{op.partner_name || "—"}</td>
                      <td><StatusBadge status={op.status} /></td>
                      <td className="text-navy-400">{op.items.length} item{op.items.length !== 1 ? "s" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Recent Stock Movements */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-heading-sm font-semibold text-navy">Recent Stock Movements</h2>
              <p className="text-xs text-navy-400 mt-0.5">Last 10 operations</p>
            </div>
            <button onClick={() => navigate("/ledger")} className="text-xs text-primary hover:underline font-medium">
              View ledger →
            </button>
          </div>
          <div className="overflow-x-auto">
            {actLoading ? (
              <div className="p-5"><LoadingState rows={4} /></div>
            ) : !activity?.length ? (
              <EmptyState
                icon={<Clock className="h-8 w-8" />}
                title="No recent activity"
                description="No stock operations yet."
              />
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.slice(0, 8).map((op: Operation) => (
                    <tr key={op.id}>
                      <td className="font-mono text-xs text-navy font-semibold">{op.reference}</td>
                      <td><StatusBadge status={op.type} /></td>
                      <td><StatusBadge status={op.status} /></td>
                      <td className="text-navy-400 text-xs">
                        {new Date(op.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
