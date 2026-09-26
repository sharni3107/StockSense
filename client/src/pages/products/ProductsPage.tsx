import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import { categoriesApi } from "../../api/categories";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import { Badge } from "../../components/Badge";
import { SearchBar } from "../../components/SearchBar";
import { FilterBar } from "../../components/FilterBar";
import { Select } from "../../components/FormField";
import { LoadingState, ErrorMessage, EmptyState } from "../../components/States";

export default function ProductsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data, isLoading, error } = useQuery({
    queryKey: ["products", search, categoryId, status],
    queryFn: () => productsApi.list({ search: search || undefined, categoryId: categoryId || undefined, status: status || undefined }),
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="All items tracked across your warehouses."
        actions={<Button onClick={() => navigate("/products/new")}>Add Product</Button>}
      />

      <div className="mb-4 flex items-center justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or SKU..." />
        <FilterBar>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-44">
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </Select>
        </FilterBar>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorMessage message={(error as Error).message} />}
      {data && data.length === 0 && (
        <EmptyState title="No products found" description="Try a different search or add your first product." />
      )}

      {data && data.length > 0 && (
        <Table
          rows={data}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/products/${p.id}`)}
          columns={[
            { header: "Product", render: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
            { header: "SKU", render: (p) => <span className="tabular-nums text-slate-500">{p.sku}</span> },
            { header: "Category", render: (p) => p.category.name },
            { header: "Unit", render: (p) => p.unit },
            {
              header: "Stock",
              align: "right",
              render: (p) => (
                <span className="font-medium">
                  {p.totalStock} {p.unit}
                </span>
              ),
            },
            {
              header: "Location",
              render: (p) =>
                p.locationCount === 0 ? "—" : p.locationCount === 1 ? p.primaryLocation : `${p.locationCount} locations`,
            },
            { header: "Reorder Level", align: "right", render: (p) => p.reorderLevel },
            { header: "Status", render: (p) => <Badge status={p.status} /> },
            {
              header: "Actions",
              align: "right",
              render: (p) => (
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/products/${p.id}/edit`);
                  }}
                >
                  Edit
                </button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
