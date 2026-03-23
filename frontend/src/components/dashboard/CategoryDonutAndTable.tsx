import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { ExpenseResponse } from "@/types/expense";
import { PIE_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { AnomalyBadge } from "./AnomalyBadge";
import { SkeletonTable } from "./skeletons";

export function CategoryDonutAndTable({
  isLoading,
  payload,
}: {
  isLoading: boolean;
  payload: ExpenseResponse;
}) {
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col max-h-[32rem]">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Category share</p>
            <p className="text-2xl font-semibold">Spend allocation</p>
          </div>
          <span className="text-xs text-slate-400">{payload.categories.length} categories</span>
        </div>
        <div className="mt-6 h-46 shrink-0">
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
                  <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                formatter={(value: number, label) => [formatCurrency(Number(value)), label]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 space-y-2 overflow-y-auto flex-1 min-h-0">
          {payload.categories.map((category, index) => (
            <li
              key={category.label}
              className="flex items-center justify-between text-sm text-slate-200"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
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
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Latest transactions</p>
            <p className="text-2xl font-semibold">AI anomaly review</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto overflow-y-auto max-h-96">
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
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
                  <tr key={transaction.id} className="border-t border-white/10 text-slate-100">
                    <td className="py-3 font-medium">{transaction.merchant}</td>
                    <td className="py-3 text-slate-300">{transaction.category}</td>
                    <td className="py-3 font-semibold">{formatCurrency(transaction.amount)}</td>
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
                              transaction.anomaly ? "bg-rose-400" : "bg-emerald-400"
                            }`}
                            style={{ width: `${transaction.confidence * 100}%` }}
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
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No transactions yet. Upload a statement to begin.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
