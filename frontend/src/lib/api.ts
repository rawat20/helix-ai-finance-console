/**
 * Shared HTTP helpers for the dashboard: base URL from env and a fetcher compatible with SWR.
 */
import axios from "axios";

/** Backend origin; override in production via `NEXT_PUBLIC_API_BASE_URL`. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** Unwraps the nested `data` field from Express `{ success, data }` responses. */
export const fetcher = (url: string) =>
  axios.get(url).then((res) => res.data?.data ?? res.data);

export const authFetch = (url: string, options: RequestInit = {}, tokenOverride?: string | null) => {
  const token =
    tokenOverride ??
    (typeof window !== "undefined" ? localStorage.getItem("helix_token") : null);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export const authFetcher = (url: string, tokenOverride?: string | null) =>
  authFetch(url, {}, tokenOverride).then(async (res) => {
    if (!res.ok) {
      const err = new Error(`Request failed: ${res.status}`) as Error & {
        response?: { status: number };
      };
      err.response = { status: res.status };
      throw err;
    }
    const json = await res.json();
    return json?.data ?? json;
  });
