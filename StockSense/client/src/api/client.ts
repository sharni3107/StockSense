/**
 * Centralized StockSense API client.
 * Authentication is handled by FastAPI using an HTTP-only JWT cookie.
 */
const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

function getApiBaseUrl() {
  if (!configuredBaseUrl) return "/api";
  const base = configuredBaseUrl.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = body?.error || body?.detail || "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return body as T;
}
