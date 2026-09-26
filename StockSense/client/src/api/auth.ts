import { apiFetch } from "./client";

export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";
  created_at?: string;
}

export function fetchMe() {
  return apiFetch<User>("/me");
}

export function updateProfile(data: { name: string }) {
  return apiFetch<User>("/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function requestPasswordReset(email: string) {
  return apiFetch<{ message: string; reset_token?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
