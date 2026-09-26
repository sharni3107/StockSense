import { apiFetch } from "./client";

export interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  reorderLevel: number;
  category: { id: string; name: string };
  totalStock: number;
  locationCount: number;
  primaryLocation: string | null;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface ProductDetail extends Omit<ProductListItem, "locationCount" | "primaryLocation"> {
  stockByLocation: { locationId: string; locationName: string; warehouseName: string; quantity: number }[];
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: string;
}

function buildQuery(filters: ProductFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const productsApi = {
  list: (filters: ProductFilters = {}) => apiFetch<ProductListItem[]>(`/products${buildQuery(filters)}`),
  get: (id: string) => apiFetch<ProductDetail>(`/products/${id}`),
  create: (data: {
    name: string;
    sku: string;
    categoryId: string;
    unit: string;
    reorderLevel: number;
    initialStock?: number;
    locationId?: string;
  }) => apiFetch<{ id: string }>("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: Partial<{ name: string; sku: string; categoryId: string; unit: string; reorderLevel: number }>
  ) => apiFetch<{ id: string }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<{ message: string }>(`/products/${id}`, { method: "DELETE" }),
};
