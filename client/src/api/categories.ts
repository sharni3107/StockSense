import { apiFetch } from "./client";

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export const categoriesApi = {
  list: () => apiFetch<Category[]>("/categories"),
  create: (name: string) => apiFetch<Category>("/categories", { method: "POST", body: JSON.stringify({ name }) }),
  update: (id: string, name: string) =>
    apiFetch<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
  remove: (id: string) => apiFetch<{ message: string }>(`/categories/${id}`, { method: "DELETE" }),
};
