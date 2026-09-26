import { PageHeader } from "../../components/PageHeader";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Inventory Dashboard"
        description="Monitor stock levels and warehouse operations."
      />
      <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center text-sm text-slate-400">
        KPI cards, recent operations, low-stock, and pending-operations panels will appear here
        once Products, Stock, and Operations are built (Hour 6 of the plan).
      </div>
    </div>
  );
}
