import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { ExpenseResponse } from "@/types/expense";
import { formatCurrency } from "@/lib/format";
import { FileUploadCard } from "./FileUploadCard";
import { UploadProgressOverlay } from "./UploadProgressOverlay";
import { SkeletonChart } from "./skeletons";

export function UploadAndMonthlyChart({
  isLoading,
  payload,
  uploading,
  fileName,
  onUpload,
}: {
  isLoading: boolean;
  payload: ExpenseResponse;
  uploading: boolean;
  fileName: string | null;
  onUpload: (file: File) => void;
}) {
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden h-full">
        {uploading ? (
          <div className="h-full flex items-center justify-center p-6">
            <UploadProgressOverlay fileName={fileName} />
          </div>
        ) : (
          <FileUploadCard onUpload={onUpload} uploading={uploading} fileName={fileName} />
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Monthly spending</p>
            <p className="text-2xl font-semibold">AI-normalized spend</p>
          </div>
        </div>
        {isLoading ? (
          <SkeletonChart />
        ) : (
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
        )}
      </div>
    </section>
  );
}
