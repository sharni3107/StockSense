import { apiFetch } from "./client";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  locationCount: number;
}

export const warehousesApi = {
  list: () => apiFetch<Warehouse[]>("/warehouses"),
  create: (data: { name: string; code: string; address?: string }) =>
    apiFetch<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; code?: string; address?: string }) =>
    apiFetch<Warehouse>(`/warehouses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};
