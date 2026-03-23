import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** Unwraps the nested `data` field from Express `{ success, data }` responses. */
export const fetcher = (url: string) =>
  axios.get(url).then((res) => res.data?.data ?? res.data);
