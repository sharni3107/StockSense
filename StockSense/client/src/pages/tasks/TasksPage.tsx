import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { dashboardApi, Operation } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge, EmptyState, LoadingState, KPICard } from "../../components/ui";
import {
  CheckSquare,
  ArrowDownCircle,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  PlayCircle,
  Filter,
} from "lucide-react";

export default function TasksPage() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>("");

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

  const filteredTasks = tasks?.filter((t) => {
    if (!filterType) return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Warehouse Task Queue"
        description="Assigned fulfillment, inbound processing, and internal movement tasks."
      />

      {/* KPI Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Deliveries to Pick"
          value={counts?.picking_tasks ?? 0}
          icon={<Truck className="h-4 w-4" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <KPICard
          title="Inbound Receipts"
          value={counts?.pending_receipts ?? 0}
          icon={<ArrowDownCircle className="h-4 w-4" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="Internal Transfers"
          value={counts?.pending_transfers ?? 0}
          icon={<ArrowLeftRight className="h-4 w-4" />}
          iconBg="bg-teal-50 text-teal-600"
        />
        <KPICard
          title="Stock Counts"
          value={counts?.stock_counts ?? 0}
          icon={<ClipboardCheck className="h-4 w-4" />}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl overflow-x-auto">
          {[
            { label: "All Tasks", val: "" },
            { label: "Receipts", val: "RECEIPT" },
            { label: "Deliveries", val: "DELIVERY" },
            { label: "Transfers", val: "TRANSFER" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setFilterType(tab.val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterType === tab.val
                  ? "bg-white text-navy shadow-sm"
                  : "text-navy-500 hover:text-navy"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-medium text-navy-400">
          {filteredTasks?.length ?? 0} task{filteredTasks?.length !== 1 ? "s" : ""} in queue
        </span>
      </div>

      {/* Tasks Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {tasksLoading ? (
            <div className="p-6">
              <LoadingState rows={5} />
            </div>
          ) : !filteredTasks?.length ? (
            <EmptyState
              icon={<CheckSquare className="h-10 w-10" />}
              title="No pending tasks"
              description="Your operational queue is currently clear."
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Task Reference</th>
                  <th>Operation Type</th>
                  <th>Destination / Customer / Partner</th>
                  <th>Status</th>
                  <th>Total Items</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((op: Operation) => {
                  const targetUrl =
                    op.type === "RECEIPT"
                      ? "/receipts"
                      : op.type === "DELIVERY"
                      ? "/deliveries"
                      : "/transfers";

                  return (
                    <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-mono text-xs text-navy font-semibold">
                        {op.reference}
                      </td>
                      <td>
                        <StatusBadge status={op.type} />
                      </td>
                      <td className="text-navy-600 text-sm font-medium">
                        {op.partner_name ||
                          op.destination_location_name ||
                          op.source_location_name ||
                          "—"}
                      </td>
                      <td>
                        <StatusBadge status={op.status} />
                      </td>
                      <td className="text-navy-500 text-xs">
                        {op.items.length} item{op.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="text-xs text-navy-400">
                        {new Date(op.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => navigate(targetUrl)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Execute Task
                        </button>
                      </td>
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
