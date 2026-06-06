import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { API_BASE_URL, authFetch, authFetcher } from "@/lib/api";
import type { ExpenseResponse, InsightItem, InsightsData } from "@/types/expense";

/**
 * Central hook for the expense dashboard: SWR data for transactions and (when open) AI insights,
 * upload/export handlers, and derived UI values (payload, flagged %).
 *
 * @returns Dashboard state, derived data, and handlers for `page.tsx` and future consumers.
 */
export function useExpenseDashboard() {
  const { data: session, status } = useSession();
  const helixToken = session?.helixToken;
  const authReady = status === "authenticated" && Boolean(helixToken);

  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  /** Primary dataset: summary, categories, monthly series, transactions (GET /api/transactions). */
  const { data, error, isLoading, mutate } = useSWR(
    authReady ? `${API_BASE_URL}/api/transactions` : null,
    (url) => authFetcher(url, helixToken),
    {
      revalidateOnFocus: false,
      /** Skip noisy retries when the API returns 404 (empty DB) early in the retry window. */
      onErrorRetry: (err, _key, _config, _revalidate, { retryCount }) => {
        if (retryCount < 2 && err.response?.status === 404) {
          return;
        }
      },
    }
  );

  /** Fetched only while the insights modal is open to avoid extra Gemini calls on every page load. */
  const { data: insightsData, isLoading: insightsLoading } = useSWR<InsightsData>(
    authReady && insightsOpen ? `${API_BASE_URL}/api/insights` : null,
    (url) => authFetcher(url, helixToken),
    {
      revalidateOnFocus: false,
    }
  );

  /** True when the transactions request failed or returned nothing (banner + “cached” messaging). */
  const apiUnavailable = !data || !!error;

  /** Stable object for charts/tables with safe defaults when `data` is still loading. */
  const payload = useMemo(
    () =>
      ({
        summary: {
          totalSpend: data?.summary?.totalSpend ?? 0,
          flaggedCount: data?.summary?.flaggedCount ?? 0,
          avgTicket: data?.summary?.avgTicket ?? 0,
        },
        categories: data?.categories ?? [],
        monthlySpending: data?.monthlySpending ?? [],
        transactions: data?.transactions ?? [],
        source: data?.source ?? undefined,
      }) as ExpenseResponse,
    [data]
  );

  /** Human-readable % of transactions marked anomalous (for KPI helper text). */
  const flaggedRate = useMemo(() => {
    if (!payload.transactions.length) return "0%";
    return `${Math.round((payload.summary.flaggedCount / payload.transactions.length) * 100)}%`;
  }, [payload]);

  const insights: InsightItem[] = insightsData?.insights ?? [];
  const recommendations: string[] = insightsData?.recommendations ?? [];

  /** POSTs multipart file to /api/upload, shows success/error toasts, then revalidates transactions. */
  const handleUpload = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setUploading(true);
      setUploadSuccess(null);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("files", file);

        const response = await authFetch(
          `${API_BASE_URL}/api/upload`,
          {
            method: "POST",
            body: formData,
          },
          helixToken
        );

        const responseData = await response.json();

        if (response.ok && responseData.success) {
          const { transactionsAdded, transactionsSaved, anomaliesDetected } = responseData.data;
          setUploadSuccess(
            `Successfully uploaded! ${transactionsAdded} transactions processed, ${transactionsSaved} saved to database${
              anomaliesDetected > 0 ? `, ${anomaliesDetected} anomalies detected` : ""
            }.`
          );
          void mutate();
          setTimeout(() => setUploadSuccess(null), 5000);
        } else {
          setUploadError(
            responseData.error || responseData.message || "Failed to upload file"
          );
          setTimeout(() => setUploadError(null), 5000);
        }
      } catch (err: unknown) {
        const fetchErr = err as {
          response?: { status?: number; data?: { error?: string; message?: string } };
          message?: string;
        };
        let errorMessage = fetchErr.message || "Failed to upload file";
        if (fetchErr.response?.data) {
          errorMessage =
            fetchErr.response.data.error ||
            fetchErr.response.data.message ||
            errorMessage;
        }
        setUploadError(errorMessage);
        console.error("Upload error:", err);
        setTimeout(() => setUploadError(null), 5000);
      } finally {
        setUploading(false);
      }
    },
    [mutate, helixToken]
  );

  /** GET /api/export and triggers a browser download of the CSV (filename from Content-Disposition). */
  const handleExport = useCallback(async () => {
    try {
      const url = `${API_BASE_URL}/api/export`;
      const resp = await authFetch(
        url,
        {
          method: "GET",
          headers: { Accept: "text/csv" },
        },
        helixToken
      );

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Export error response:", text);
        alert("Export failed. Check console.");
        return;
      }

      const blob = await resp.blob();
      const filename =
        resp.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || "helix_expense_report.csv";

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed — see console");
    }
  }, [helixToken]);

  return {
    fileName,
    uploading,
    uploadSuccess,
    uploadError,
    insightsOpen,
    setInsightsOpen,
    data,
    error,
    isLoading,
    mutate,
    apiUnavailable,
    payload,
    flaggedRate,
    insightsLoading,
    insights,
    recommendations,
    handleUpload,
    handleExport,
  };
}
