import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { API_BASE_URL, fetcher } from "@/lib/api";
import type { ExpenseResponse, InsightItem, InsightsData } from "@/types/expense";

export function useExpenseDashboard() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/transactions`,
    fetcher,
    {
      revalidateOnFocus: false,
      onErrorRetry: (err, _key, _config, _revalidate, { retryCount }) => {
        if (retryCount < 2 && err.response?.status === 404) {
          return;
        }
      },
    }
  );

  const { data: insightsData, isLoading: insightsLoading } = useSWR<InsightsData>(
    insightsOpen ? `${API_BASE_URL}/api/insights` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const apiUnavailable = !data || !!error;

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

  const flaggedRate = useMemo(() => {
    if (!payload.transactions.length) return "0%";
    return `${Math.round((payload.summary.flaggedCount / payload.transactions.length) * 100)}%`;
  }, [payload]);

  const insights: InsightItem[] = insightsData?.insights ?? [];
  const recommendations: string[] = insightsData?.recommendations ?? [];

  const handleUpload = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setUploading(true);
      setUploadSuccess(null);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("files", file);

        const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          const { transactionsAdded, transactionsSaved, anomaliesDetected } = response.data.data;
          setUploadSuccess(
            `Successfully uploaded! ${transactionsAdded} transactions processed, ${transactionsSaved} saved to database${
              anomaliesDetected > 0 ? `, ${anomaliesDetected} anomalies detected` : ""
            }.`
          );
          void mutate();
          setTimeout(() => setUploadSuccess(null), 5000);
        }
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { error?: string; message?: string } };
          message?: string;
        };
        const errorMessage =
          axiosErr.response?.data?.error ||
          axiosErr.response?.data?.message ||
          axiosErr.message ||
          "Failed to upload file";
        setUploadError(errorMessage);
        console.error("Upload error:", err);
        setTimeout(() => setUploadError(null), 5000);
      } finally {
        setUploading(false);
      }
    },
    [mutate]
  );

  const handleExport = useCallback(async () => {
    try {
      const url = `${API_BASE_URL}/api/export`;
      const resp = await fetch(url, {
        method: "GET",
        headers: { Accept: "text/csv" },
      });

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
  }, []);

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
