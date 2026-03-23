import type { ExpenseResponse } from "@/types/expense";
import { formatCurrency } from "@/lib/format";
import { StatCard } from "./StatCard";
import { SkeletonCard } from "./skeletons";

export function KpiSection({
  isLoading,
  payload,
  flaggedRate,
}: {
  isLoading: boolean;
  payload: ExpenseResponse;
  flaggedRate: string;
}) {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        <>
          <StatCard
            label="Total spend (90d)"
            value={formatCurrency(payload?.summary?.totalSpend ?? 0, true)}
            helper="Synced live · Database"
          />
          <StatCard
            label="Flagged transactions"
            value={(payload?.summary?.flaggedCount ?? 0).toString()}
            helper={`${flaggedRate} of recent transactions`}
          />
          <StatCard
            label="Average ticket size"
            value={formatCurrency(Number(payload?.summary?.avgTicket ?? 0))}
            helper="Per transaction"
          />
          <StatCard
            label="Total transactions"
            value={payload.transactions.length.toString()}
            helper="All time"
          />
        </>
      )}
    </section>
  );
}
