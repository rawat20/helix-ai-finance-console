"use client";

import { ChangeEvent, useMemo, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { useCSVParser } from "@/utils/useCSVParser";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type ExpenseSummary = {
  totalSpend: number;
  flaggedCount: number;
  avgTicket: number;
};

type CategoryPoint = {
  label: string;
  value: number;
};

type MonthlyPoint = {
  label: string;
  value: number;
};

type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  anomaly: boolean;
  confidence: number;
  note?: string;
};

type ExpenseResponse = {
  summary: ExpenseSummary;
  categories: CategoryPoint[];
  monthlySpending: MonthlyPoint[];
  transactions: Transaction[];
  source?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

  const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data?.data ?? res.data);

const PIE_COLORS = ["#6366F1", "#F97316", "#34D399", "#F43F5E", "#22D3EE", "#FBBF24"];

const formatCurrency = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
  }).format(value);

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-lg shadow-slate-950/20 backdrop-blur">
      <p className="text-sm uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {helper ? (
        <p className="text-xs text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

function FileUploadCard({
  onUpload,
  uploading,
  fileName,
  parsing,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
  fileName: string | null;
  parsing?: boolean;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <label
      htmlFor="expense-upload"
      className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center transition hover:border-indigo-400/80 hover:bg-white/10"
    >
      <input
        id="expense-upload"
        type="file"
        className="sr-only"
        accept=".csv,.xlsx,.xls,.json"
        onChange={handleChange}
      />
      <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
        Upload
      </span>
      <p className="mt-3 text-lg font-semibold">Drop bank exports or receipts</p>
      <p className="text-sm text-slate-300">
        CSV, Excel, JSON · Each file scanned by the AI classifier
      </p>
      <p className="mt-4 text-sm text-indigo-200">
        {uploading
          ? "Uploading and processing…"
          : parsing
            ? "Parsing CSV file…"
            : fileName
              ? `Ready: ${fileName}`
              : "Click or drag files to start"}
      </p>
    </label>
  );
}

function AnomalyBadge({ anomaly }: { anomaly: boolean }) {
  if (!anomaly) {
    return (
      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
        Normal
      </span>
    );
  }

  return (
    <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200">
      Flagged
    </span>
  );
}

export default function Home() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<
    Array<{
      date: string;
      amount: number;
      description: string;
      merchant: string;
      category: string | null;
    }>
  >([]);
  const { parseFile, loading: parsing, error: parseError } = useCSVParser();

  // Try to fetch from database first, fallback to expenses endpoint
  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE_URL}/api/transactions`,
    fetcher,
    {
      refreshInterval: 60_000,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // If transactions endpoint fails, try expenses endpoint
        if (retryCount < 2 && error.response?.status === 404) {
          return;
        }
      },
    }
  );

  // Fallback to expenses endpoint if transactions not available
  const { data: fallbackData } = useSWR(
    data ? null : `${API_BASE_URL}/api/expenses`,
    fetcher,
    {
      refreshInterval: 60_000,
    }
  );

  const displayData = data || fallbackData;

  // --- NEW: determine whether API is effectively unavailable
  // Show banner only when neither primary nor fallback provided data
  const apiUnavailable = (!data && !fallbackData) || (error && !fallbackData);
  // --- END NEW

  // --- NORMALIZE payload: guarantee nested fields exist to avoid runtime `undefined` reads ---
  const payload = {
    summary: {
      totalSpend: displayData?.summary?.totalSpend ?? 0,
      flaggedCount: displayData?.summary?.flaggedCount ?? 0,
      avgTicket: displayData?.summary?.avgTicket ?? 0,
    },
    categories: displayData?.categories ?? [],
    monthlySpending: displayData?.monthlySpending ?? [],
    transactions: displayData?.transactions ?? [],
    source: displayData?.source ?? undefined,
  } as ExpenseResponse;

  // Use the normalized payload to compute rates — avoids reading from partial displayData
  const flaggedRate = useMemo(() => {
    if (!payload.transactions.length) return "0%";
    return `${Math.round((payload.summary.flaggedCount / payload.transactions.length) * 100)}%`;
  }, [payload]);

  const handleUpload = async (file: File) => {
    setFileName(file.name);
    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    try {
      // Parse CSV on frontend for preview (optional)
      const isCSV =
        file.type === "text/csv" ||
        file.name.toLowerCase().endsWith(".csv") ||
        file.type === "text/plain";

      if (isCSV) {
        try {
          const transactions = await parseFile(file);
          setParsedTransactions(transactions);
          console.log(`Parsed ${transactions.length} transactions from CSV`);
        } catch (parseErr) {
          console.error("CSV parsing error:", parseErr);
        }
      }

      // Upload to backend
      const formData = new FormData();
      formData.append("files", file);

      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        const { transactionsAdded, transactionsSaved, anomaliesDetected } =
          response.data.data;
        setUploadSuccess(
          `Successfully uploaded! ${transactionsAdded} transactions processed, ${transactionsSaved} saved to database${anomaliesDetected > 0 ? `, ${anomaliesDetected} anomalies detected` : ""}.`
        );
        // Refresh data after successful upload
        void mutate();
        // Clear success message after 5 seconds
        setTimeout(() => setUploadSuccess(null), 5000);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to upload file";
      setUploadError(errorMessage);
      console.error("Upload error:", err);
      // Clear error message after 5 seconds
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
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
  };
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              HELIX AI Assistant
            </p>
            <h1 className="text-2xl font-semibold">Expense Insight console</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  payload.source === "database"
                    ? "bg-emerald-400"
                    : payload.source === "python-service"
                      ? "bg-blue-400"
                      : "bg-yellow-400"
                }`}
              />
              {payload.source === "database"
                ? "Live · Database"
                : payload.source === "python-service"
                  ? "Live · Python"
                  : payload.source === "fallback"
                    ? "Cache snapshot"
                    : "Connecting…"}
            </div>

          </div>
        </nav>

        {apiUnavailable ? (
          <p className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Unable to reach the API gateway. Showing cached data.
          </p>
        ) : null}

        {uploadSuccess ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {uploadSuccess}
          </div>
        ) : null}

        {uploadError ? (
          <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Upload failed: {uploadError}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total spend (90d)"
            value={formatCurrency(payload?.summary?.totalSpend ?? 0, true)}
            helper={payload.source === "python-service" ? "Synced live" : "Using cache"}
          />
          <StatCard
            label="Flagged transactions"
            value={(payload?.summary?.flaggedCount ?? 0).toString()}
            helper={`${flaggedRate} of recent transactions`}
          />
          <StatCard
            label="Average ticket size"
            value={formatCurrency(Number(payload?.summary?.avgTicket ?? 0))}
            helper="AI confidence ≥ 78%"
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <FileUploadCard
            onUpload={handleUpload}
            uploading={uploading}
            fileName={fileName}
            parsing={parsing}
          />
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Monthly spending
                </p>
                <p className="text-2xl font-semibold">AI-normalized spend</p>
              </div>
              <p className="text-xs text-slate-400">
                {isLoading ? "Refreshing…" : "Auto-refresh · 60s"}
              </p>
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payload.monthlySpending}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#cbd5f5", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, stroke: "#0f172a" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Category share
                </p>
                <p className="text-2xl font-semibold">Spend allocation</p>
              </div>
              <span className="text-xs text-slate-400">
                {payload.categories.length} categories
              </span>
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payload.categories}
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {payload.categories.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    formatter={(value: number, label) => [
                      formatCurrency(Number(value)),
                      label,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2">
              {payload.categories.map((category, index) => (
                <li
                  key={category.label}
                  className="flex items-center justify-between text-sm text-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    {category.label}
                  </div>
                  <span>{formatCurrency(category.value)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Latest transactions
                </p>
                <p className="text-2xl font-semibold">AI anomaly review</p>
              </div>
              <button className="text-sm text-indigo-200 hover:text-white">
                View all
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-300">
                    <th className="py-2">Merchant</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Anomaly</th>
                    <th className="py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-t border-white/10 text-slate-100"
                    >
                      <td className="py-3 font-medium">{transaction.merchant}</td>
                      <td className="py-3 text-slate-300">{transaction.category}</td>
                      <td className="py-3 font-semibold">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 text-slate-300">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <AnomalyBadge anomaly={transaction.anomaly} />
                        {transaction.note ? (
                          <p className="text-xs text-slate-400">{transaction.note}</p>
                        ) : null}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${
                                transaction.anomaly
                                  ? "bg-rose-400"
                                  : "bg-emerald-400"
                              }`}
                              style={{
                                width: `${transaction.confidence * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-300">
                            {(transaction.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!payload.transactions.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-slate-400"
                      >
                        No transactions yet. Upload a statement to begin.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


