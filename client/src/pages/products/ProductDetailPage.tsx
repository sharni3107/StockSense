import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Table } from "../../components/Table";
import { LoadingState, ErrorMessage, EmptyState } from "../../components/States";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id!),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title={data.name}
        description={`SKU: ${data.sku}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/products")}>
              Back to Products
            </Button>
            <Button onClick={() => navigate(`/products/${data.id}/edit`)}>Edit</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <InfoCard label="Category" value={data.category.name} />
        <InfoCard label="Current Total Stock" value={`${data.totalStock} ${data.unit}`} />
        <InfoCard label="Reorder Level" value={`${data.reorderLevel} ${data.unit}`} />
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</div>
          <div className="mt-2">
            <Badge status={data.status} />
          </div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-900 mb-2">Stock by Location</h2>
      {data.stockByLocation.length === 0 ? (
        <EmptyState title="No stock recorded yet" description="Stock appears here once a receipt is validated." />
      ) : (
        <Table
          rows={data.stockByLocation}
          rowKey={(s) => s.locationId}
          columns={[
            { header: "Warehouse", render: (s) => s.warehouseName },
            { header: "Location", render: (s) => s.locationName },
            { header: "Quantity", align: "right", render: (s) => `${s.quantity} ${data.unit}` },
          ]}
        />
      )}

      <h2 className="text-sm font-semibold text-slate-900 mb-2 mt-6">Recent Movements</h2>
      <EmptyState
        title="Move history not available yet"
        description="This will populate once Receipts, Deliveries, Transfers, and Adjustments are built."
      />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
