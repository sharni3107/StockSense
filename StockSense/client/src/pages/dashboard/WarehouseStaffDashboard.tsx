import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { dashboardApi, Operation } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { KPICard, StatusBadge, EmptyState, LoadingState } from "../../components/ui";
import {
  CheckSquare, ArrowDownCircle, Truck, ArrowLeftRight,
  ClipboardCheck, Package, ArrowRight, PlayCircle
} from "lucide-react";

export function WarehouseStaffDashboard() {
  const navigate = useNavigate();

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["staff-task-counts"],
    queryFn: dashboardApi.taskCounts,
    refetchInterval: 15000,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["staff-task-list"],
    queryFn: dashboardApi.taskList,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-8 animate-in">
      <PageHeader
        title="Warehouse Operations Dashboard"
        description="Daily operational queue and fulfillment tasks."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {countsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card h-28 bg-surface animate-pulse" />
          ))
        ) : (
          <>
            <KPICard
              title="Items to Pick"
              value={counts?.picking_tasks ?? 0}
              icon={<Truck className="h-4 w-4" />}
              iconBg="bg-purple-50 text-purple-600"
              link={{ label: "Go to Deliveries", onClick: () => navigate("/deliveries") }}
            />
            <KPICard
              title="Pending Receipts"
              value={counts?.pending_receipts ?? 0}
              icon={<ArrowDownCircle className="h-4 w-4" />}
              iconBg="bg-blue-50 text-blue-600"
              link={{ label: "Go to Receipts", onClick: () => navigate("/receipts") }}
            />
            <KPICard
              title="Internal Transfers"
              value={counts?.pending_transfers ?? 0}
              icon={<ArrowLeftRight className="h-4 w-4" />}
              iconBg="bg-teal-50 text-teal-600"
              link={{ label: "Go to Transfers", onClick: () => navigate("/transfers") }}
            />
            <KPICard
              title="Stock Counts Needed"
              value={counts?.stock_counts ?? 0}
              icon={<ClipboardCheck className="h-4 w-4" />}
              iconBg="bg-amber-50 text-amber-600"
              link={{ label: "Go to Adjustments", onClick: () => navigate("/adjustments") }}
            />
          </>
        )}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate("/receipts")}
          className="card p-5 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-navy group-hover:text-primary transition-colors text-sm">Receive Inbound Stock</h3>
              <p className="text-xs text-navy-400">Accept and validate incoming vendor shipments</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-navy-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => navigate("/deliveries")}
          className="card p-5 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-navy group-hover:text-primary transition-colors text-sm">Pick & Pack Orders</h3>
              <p className="text-xs text-navy-400">Fulfill and pack outgoing customer deliveries</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-navy-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => navigate("/adjustments")}
          className="card p-5 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-navy group-hover:text-primary transition-colors text-sm">Physical Inventory Count</h3>
              <p className="text-xs text-navy-400">Perform cycle count & correct discrepancies</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-navy-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Task Queue Table */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-heading-sm font-semibold text-navy">Immediate Operational Tasks</h2>
            <p className="text-xs text-navy-400 mt-0.5">Pending operations requiring warehouse action</p>
          </div>
          <span className="text-xs bg-primary-50 text-primary font-medium px-2.5 py-1 rounded-full">
            {tasks?.length ?? 0} Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          {tasksLoading ? (
            <div className="p-5"><LoadingState rows={5} /></div>
          ) : !tasks?.length ? (
            <EmptyState
              icon={<CheckSquare className="h-8 w-8" />}
              title="All caught up!"
              description="No open operations requiring warehouse staff attention right now."
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Partner / Destination</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((op: Operation) => {
                  const targetUrl =
                    op.type === "RECEIPT"
                      ? "/receipts"
                      : op.type === "DELIVERY"
                      ? "/deliveries"
                      : "/transfers";

                  return (
                    <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-mono text-xs text-navy font-semibold">{op.reference}</td>
                      <td><StatusBadge status={op.type} /></td>
                      <td className="text-navy-600 text-sm">
                        {op.partner_name || op.destination_location_name || "—"}
                      </td>
                      <td><StatusBadge status={op.status} /></td>
                      <td className="text-navy-400 text-xs">
                        {op.items.length} item{op.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => navigate(targetUrl)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Process
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
