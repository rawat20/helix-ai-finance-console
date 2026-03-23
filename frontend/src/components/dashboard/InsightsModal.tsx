import type { InsightItem } from "@/types/expense";
import { SkeletonInsights } from "./skeletons";

/**
 * Full-screen overlay: Gemini AI insights and recommendations from `/api/insights`.
 */
export function InsightsModal({
  open,
  onClose,
  insightsLoading,
  insights,
  recommendations,
}: {
  open: boolean;
  onClose: () => void;
  insightsLoading: boolean;
  insights: InsightItem[];
  recommendations: string[];
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Gemini AI</p>
            <p className="text-2xl font-semibold text-white">Insights & Recommendations</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-full border border-white/10 p-1.5 text-slate-400 hover:border-white/30 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {insightsLoading ? (
          <SkeletonInsights />
        ) : insights.length === 0 && recommendations.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            Upload transactions to generate AI-powered insights.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {insights.map((item, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 ${
                  item.severity === "warning"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : "border-indigo-500/30 bg-indigo-500/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      item.severity === "warning" ? "bg-rose-400" : "bg-indigo-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Recommendations</p>
            <ul className="space-y-1">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
