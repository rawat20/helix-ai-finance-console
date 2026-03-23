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
