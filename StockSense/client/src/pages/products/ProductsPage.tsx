import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  productsApi,
  categoriesApi,
  warehousesApi,
  locationsApi,
  Product,
  ProductDetail,
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
  Search,
  Package,
  AlertTriangle,
  XCircle,
  Layers,
  Edit2,
  Trash2,
  Eye,
  MapPin,
} from "lucide-react";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockStatus, setStockStatus] = useState<string>("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form states for Create
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    unit: "pcs",
    reorder_level: 10,
    initial_stock: 0,
    initial_location_id: "",
  });

  // Queries
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", { search, category_id: selectedCategory, stock_status: stockStatus }],
    queryFn: () =>
      productsApi.list({
        search: search || undefined,
        category_id: selectedCategory || undefined,
        stock_status: stockStatus || undefined,
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsApi.list(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Product created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
      setEditingProduct(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Product deleted successfully");
      setDeletingProduct(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete product");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category_id: categories?.[0]?.id || "",
      unit: "pcs",
      reorder_level: 10,
      initial_stock: 0,
      initial_location_id: locations?.[0]?.id || "",
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    if (categories?.length && !formData.category_id) {
      setFormData((prev) => ({ ...prev, category_id: categories[0].id }));
    }
    if (locations?.length && !formData.initial_location_id) {
      setFormData((prev) => ({ ...prev, initial_location_id: locations[0].id }));
    }
    setIsCreateOpen(true);
  };

  const handleOpenDetail = async (p: Product) => {
    setDetailLoading(true);
    try {
      const full = await productsApi.get(p.id);
      setDetailProduct(full);
    } catch (e: any) {
      toast.error(e.message || "Failed to load product details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Stats calculation
  const totalProducts = products?.length ?? 0;
  const lowStockCount = products?.filter((p) => p.stock_status === "low").length ?? 0;
  const outStockCount = products?.filter((p) => p.stock_status === "out").length ?? 0;
  const healthyCount = products?.filter((p) => p.stock_status === "healthy").length ?? 0;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Products & Inventory Items"
        description="Manage your inventory catalog, SKU details, and monitor stock availability."
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            Add Product
          </Button>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Products"
          value={totalProducts}
          icon={<Package className="h-4 w-4" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="Healthy Stock"
          value={healthyCount}
          icon={<Layers className="h-4 w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KPICard
          title="Low Stock"
          value={lowStockCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPICard
          title="Out of Stock"
          value={outStockCount}
          icon={<XCircle className="h-4 w-4" />}
          iconBg="bg-red-50 text-red-500"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-full text-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field text-sm w-44"
          >
            <option value="">All Categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock status filter tabs */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { label: "All Statuses", val: "" },
            { label: "Healthy", val: "healthy" },
            { label: "Low Stock", val: "low" },
            { label: "Out of Stock", val: "out" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStockStatus(tab.val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                stockStatus === tab.val
                  ? "bg-white text-navy shadow-sm"
                  : "text-navy-500 hover:text-navy"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <LoadingState rows={6} />
            </div>
          ) : !products?.length ? (
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title="No products found"
              description={
                search || selectedCategory || stockStatus
                  ? "Try adjusting your search filters or add a new product."
                  : "Start by creating your first product in the inventory."
              }
              action={
                <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
                  Add First Product
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="text-right">Total Available</th>
                  <th className="text-right">Reorder Level</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <button
                        onClick={() => handleOpenDetail(p)}
                        className="font-medium text-navy hover:text-primary text-left text-sm"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-navy-500 bg-surface px-2 py-0.5 rounded border border-border">
                        {p.sku}
                      </span>
                    </td>
                    <td className="text-sm text-navy-600">{p.category_name || "Uncategorized"}</td>
                    <td className="text-right font-semibold tabular-nums text-navy text-sm">
                      {p.total_stock} <span className="text-xs text-navy-400 font-normal">{p.unit}</span>
                    </td>
                    <td className="text-right tabular-nums text-navy-500 text-sm">
                      {p.reorder_level} {p.unit}
                    </td>
                    <td>
                      <StatusBadge status={p.stock_status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetail(p)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-surface transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingProduct(p)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-surface transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          title="Delete Product"
                          className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Product Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Product"
        description="Add a new item to your inventory catalog."
        width="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              ...formData,
              reorder_level: Number(formData.reorder_level),
              initial_stock: Number(formData.initial_stock),
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Product Name" required>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Wireless Barcode Scanner"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="SKU Code" required hint="Unique alphanumeric identifier">
              <input
                type="text"
                required
                className="input-field uppercase font-mono"
                placeholder="e.g. WBS-100"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Category" required>
              <select
                required
                className="input-field"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="" disabled>Select category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Unit of Measure" required>
              <input
                type="text"
                required
                className="input-field"
                placeholder="pcs, kg, boxes"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </FormField>

            <FormField label="Reorder Threshold" required hint="Triggers low stock alert">
              <input
                type="number"
                min="0"
                required
                className="input-field"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
              />
            </FormField>
          </div>

          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400 mb-3">
              Initial Stock Level (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Opening Stock Quantity">
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={formData.initial_stock}
                  onChange={(e) => setFormData({ ...formData, initial_stock: Number(e.target.value) })}
                />
              </FormField>

              {formData.initial_stock > 0 && (
                <FormField label="Store In Location" required>
                  <select
                    required
                    className="input-field"
                    value={formData.initial_location_id}
                    onChange={(e) => setFormData({ ...formData, initial_location_id: e.target.value })}
                  >
                    <option value="" disabled>Select warehouse location</option>
                    {locations?.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.warehouse_name ? `${l.warehouse_name} - ` : ""}{l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          title={`Edit Product: ${editingProduct.name}`}
          width="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingProduct.id,
                data: {
                  name: editingProduct.name,
                  category_id: editingProduct.category_id,
                  unit: editingProduct.unit,
                  reorder_level: Number(editingProduct.reorder_level),
                },
              });
            }}
            className="space-y-4"
          >
            <FormField label="Product Name" required>
              <input
                type="text"
                required
                className="input-field"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
              />
            </FormField>

            <FormField label="Category" required>
              <select
                required
                className="input-field"
                value={editingProduct.category_id}
                onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
              >
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Unit of Measure" required>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editingProduct.unit}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                />
              </FormField>

              <FormField label="Reorder Level" required>
                <input
                  type="number"
                  min="0"
                  required
                  className="input-field"
                  value={editingProduct.reorder_level}
                  onChange={(e) => setEditingProduct({ ...editingProduct, reorder_level: Number(e.target.value) })}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" type="button" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Product Detail Modal */}
      {detailProduct && (
        <Modal
          open={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          title={detailProduct.name}
          description={`SKU: ${detailProduct.sku} • Category: ${detailProduct.category_name || "None"}`}
          width="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 bg-surface p-4 rounded-xl">
              <div>
                <p className="text-xs text-navy-400">Total Stock</p>
                <p className="text-xl font-bold text-navy mt-1">
                  {detailProduct.total_stock} {detailProduct.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400">Reorder Level</p>
                <p className="text-xl font-bold text-navy mt-1">
                  {detailProduct.reorder_level} {detailProduct.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={detailProduct.stock_status} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> Stock by Warehouse Location
              </h4>

              {!detailProduct.stock_by_location?.length ? (
                <p className="text-sm text-navy-400 italic bg-slate-50 p-4 rounded-lg text-center">
                  No stock records in any location for this product.
                </p>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Warehouse</th>
                        <th>Location</th>
                        <th className="text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailProduct.stock_by_location.map((loc) => (
                        <tr key={loc.location_id}>
                          <td className="font-medium text-navy text-sm">{loc.warehouse_name}</td>
                          <td className="text-navy-600 text-sm">{loc.location_name}</td>
                          <td className="text-right font-mono font-semibold tabular-nums text-sm text-navy">
                            {loc.quantity} {detailProduct.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setDetailProduct(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingProduct && (
        <ConfirmDialog
          open={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={() => deleteMutation.mutate(deletingProduct.id)}
          title="Delete Product"
          description={`Are you sure you want to delete "${deletingProduct.name}" (${deletingProduct.sku})? This action cannot be undone.`}
          confirmLabel="Delete Product"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
