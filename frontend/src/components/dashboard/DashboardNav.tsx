import type { ExpenseResponse } from "@/types/expense";

type Source = ExpenseResponse["source"];

export function DashboardNav({
  source,
  onOpenInsights,
  onExport,
}: {
  source: Source;
  onOpenInsights: () => void;
  onExport: () => void;
}) {
  return (
    <nav className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">HELIX AI Assistant</p>
        <h1 className="text-2xl font-semibold">Expense Insight console</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          <span
            className={`h-2 w-2 rounded-full ${
              source === "database"
                ? "bg-emerald-400"
                : source === "fallback"
                  ? "bg-yellow-400"
                  : "bg-yellow-400"
            }`}
          />
          {source === "database"
            ? "Live · Database"
            : source === "fallback"
              ? "Cache snapshot"
              : "Connecting…"}
        </div>
        <button
          type="button"
          onClick={onOpenInsights}
          className="cursor-pointer rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/20 transition"
        >
          AI Insights
        </button>
        <button
          type="button"
          onClick={onExport}
          className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-indigo-400/60 hover:text-white transition"
        >
          Export CSV
        </button>
      </div>
    </nav>
  );
}
