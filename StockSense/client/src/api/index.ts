import { apiFetch } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_stock_units: number;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_receipts: number;
  pending_deliveries: number;
  scheduled_transfers: number;
}

export interface TaskCounts {
  picking_tasks: number;
  pending_receipts: number;
  pending_transfers: number;
  stock_counts: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  category_name?: string;
  unit: string;
  reorder_level: number;
  total_stock: number;
  stock_status: "healthy" | "low" | "out";
  created_at: string;
}

export interface StockByLocation {
  location_id: string;
  location_name: string;
  warehouse_name: string;
  quantity: number;
}

export interface ProductDetail extends Product {
  stock_by_location: StockByLocation[];
}

export interface Category {
  id: string;
  name: string;
  product_count: number;
  stock_units: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  location_count: number;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  warehouse_id: string;
  warehouse_name?: string;
  product_count: number;
  total_units: number;
}

export interface OperationItem {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  processed_quantity: number;
}

export interface Operation {
  id: string;
  reference: string;
  type: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  status: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";
  partner_name?: string;
  source_location_id?: string;
  source_location_name?: string;
  destination_location_id?: string;
  destination_location_name?: string;
  notes?: string;
  created_at: string;
  validated_at?: string;
  items: OperationItem[];
}

export interface LedgerEntry {
  id: string;
  created_at: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  operation_id?: string;
  reference?: string;
  operation_type: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  quantity_change: number;
  balance_after: number;
  source_location_name?: string;
  destination_location_name?: string;
  created_by_name?: string;
}

export interface ReorderRule {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  location_id: string;
  location_name?: string;
  min_qty: number;
  max_qty: number;
  current_stock: number;
  status: "healthy" | "needs_reorder" | "critical";
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  lowStock: () => apiFetch<Product[]>("/dashboard/low-stock"),
  activity: () => apiFetch<Operation[]>("/dashboard/activity"),
  pendingReceipts: () => apiFetch<Operation[]>("/dashboard/pending-receipts"),
  pendingDeliveries: () => apiFetch<Operation[]>("/dashboard/pending-deliveries"),
  taskCounts: () => apiFetch<TaskCounts>("/dashboard/my-tasks"),
  taskList: () => apiFetch<Operation[]>("/dashboard/task-list"),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: { search?: string; category_id?: string; stock_status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.category_id) q.set("category_id", params.category_id);
    if (params?.stock_status) q.set("stock_status", params.stock_status);
    return apiFetch<Product[]>(`/products${q.toString() ? `?${q}` : ""}`);
  },
  get: (id: string) => apiFetch<ProductDetail>(`/products/${id}`),
  create: (data: {
    name: string; sku: string; category_id: string; unit: string;
    reorder_level: number; initial_stock?: number; initial_location_id?: string;
  }) => apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; category_id: string; unit: string; reorder_level: number }>) =>
    apiFetch<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/products/${id}`, { method: "DELETE" }),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () => apiFetch<Category[]>("/categories"),
  create: (data: { name: string }) =>
    apiFetch<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name: string }) =>
    apiFetch<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/categories/${id}`, { method: "DELETE" }),
};

// ─── Warehouses ───────────────────────────────────────────────────────────────

export const warehousesApi = {
  list: () => apiFetch<Warehouse[]>("/warehouses"),
  create: (data: { name: string; code: string; address?: string }) =>
    apiFetch<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; address?: string }) =>
    apiFetch<Warehouse>(`/warehouses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/warehouses/${id}`, { method: "DELETE" }),
};

// ─── Locations ────────────────────────────────────────────────────────────────

export const locationsApi = {
  list: (warehouse_id?: string) => {
    const q = warehouse_id ? `?warehouse_id=${warehouse_id}` : "";
    return apiFetch<Location[]>(`/locations${q}`);
  },
  create: (data: { name: string; code: string; warehouse_id: string }) =>
    apiFetch<Location>("/locations", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; code?: string }) =>
    apiFetch<Location>(`/locations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/locations/${id}`, { method: "DELETE" }),
};

// ─── Receipts ─────────────────────────────────────────────────────────────────

export const receiptsApi = {
  list: () => apiFetch<Operation[]>("/receipts"),
  get: (id: string) => apiFetch<Operation>(`/receipts/${id}`),
  create: (data: { partner_name: string; destination_location_id: string; notes?: string; items: { product_id: string; quantity: number }[] }) =>
    apiFetch<Operation>("/receipts", { method: "POST", body: JSON.stringify(data) }),
  validate: (id: string) => apiFetch<Operation>(`/receipts/${id}/validate`, { method: "POST" }),
  cancel: (id: string) => apiFetch<Operation>(`/receipts/${id}/cancel`, { method: "POST" }),
};

// ─── Deliveries ───────────────────────────────────────────────────────────────

export const deliveriesApi = {
  list: () => apiFetch<Operation[]>("/deliveries"),
  get: (id: string) => apiFetch<Operation>(`/deliveries/${id}`),
  create: (data: { partner_name: string; source_location_id: string; notes?: string; items: { product_id: string; quantity: number }[] }) =>
    apiFetch<Operation>("/deliveries", { method: "POST", body: JSON.stringify(data) }),
  pick: (id: string, item_id: string, quantity: number) =>
    apiFetch<Operation>(`/deliveries/${id}/pick`, { method: "POST", body: JSON.stringify({ item_id, quantity }) }),
  pack: (id: string) => apiFetch<Operation>(`/deliveries/${id}/pack`, { method: "POST" }),
  validate: (id: string) => apiFetch<Operation>(`/deliveries/${id}/validate`, { method: "POST" }),
  cancel: (id: string) => apiFetch<Operation>(`/deliveries/${id}/cancel`, { method: "POST" }),
};

// ─── Transfers ────────────────────────────────────────────────────────────────

export const transfersApi = {
  list: () => apiFetch<Operation[]>("/transfers"),
  get: (id: string) => apiFetch<Operation>(`/transfers/${id}`),
  create: (data: { source_location_id: string; destination_location_id: string; notes?: string; items: { product_id: string; quantity: number }[] }) =>
    apiFetch<Operation>("/transfers", { method: "POST", body: JSON.stringify(data) }),
  validate: (id: string) => apiFetch<Operation>(`/transfers/${id}/validate`, { method: "POST" }),
  cancel: (id: string) => apiFetch<Operation>(`/transfers/${id}/cancel`, { method: "POST" }),
};

// ─── Adjustments ──────────────────────────────────────────────────────────────

export const adjustmentsApi = {
  list: () => apiFetch<Operation[]>("/adjustments"),
  create: (data: { notes?: string; lines: { product_id: string; location_id: string; physical_quantity: number }[] }) =>
    apiFetch<Operation>("/adjustments", { method: "POST", body: JSON.stringify(data) }),
};

// ─── Ledger ───────────────────────────────────────────────────────────────────

export const ledgerApi = {
  list: (params?: { product_id?: string; warehouse_id?: string; operation_type?: string; search?: string; date_from?: string; date_to?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.product_id) q.set("product_id", params.product_id);
    if (params?.warehouse_id) q.set("warehouse_id", params.warehouse_id);
    if (params?.operation_type) q.set("operation_type", params.operation_type);
    if (params?.search) q.set("search", params.search);
    if (params?.date_from) q.set("date_from", params.date_from);
    if (params?.date_to) q.set("date_to", params.date_to);
    if (params?.limit) q.set("limit", String(params.limit));
    return apiFetch<LedgerEntry[]>(`/ledger${q.toString() ? `?${q}` : ""}`);
  },
};

// ─── Reorder Rules ────────────────────────────────────────────────────────────

export const reorderRulesApi = {
  list: () => apiFetch<ReorderRule[]>("/reorder-rules"),
  create: (data: { product_id: string; location_id: string; min_qty: number; max_qty: number }) =>
    apiFetch<ReorderRule>("/reorder-rules", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { min_qty?: number; max_qty?: number }) =>
    apiFetch<ReorderRule>(`/reorder-rules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/reorder-rules/${id}`, { method: "DELETE" }),
};
