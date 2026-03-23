export function AnomalyBadge({ anomaly }: { anomaly: boolean }) {
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
