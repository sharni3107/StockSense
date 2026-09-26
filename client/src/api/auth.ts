import { apiFetch } from "./client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";
}

export function login(email: string, password: string) {
  return apiFetch<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function register(name: string, email: string, password: string) {
  return apiFetch<User>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
}

export function logout() {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export function fetchMe() {
  return apiFetch<User>("/auth/me");
}
