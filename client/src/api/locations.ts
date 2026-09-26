import { apiFetch } from "./client";

export interface Location {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
}

export const locationsApi = {
  list: (warehouseId?: string) =>
    apiFetch<Location[]>(`/locations${warehouseId ? `?warehouseId=${warehouseId}` : ""}`),
  create: (data: { name: string; code: string; warehouseId: string }) =>
    apiFetch<Location>("/locations", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; code?: string; warehouseId?: string }) =>
    apiFetch<Location>(`/locations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};
