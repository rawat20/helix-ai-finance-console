export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-950/20 animate-pulse">
      <div className="h-3 w-24 rounded bg-white/10 mb-4" />
      <div className="h-8 w-32 rounded bg-white/10 mb-2" />
      <div className="h-2 w-20 rounded bg-white/10" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-3 mt-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 border-t border-white/10 pt-3">
          <div className="h-3 w-28 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-3 w-14 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse mt-6 h-64 rounded-2xl bg-white/5 flex items-end gap-2 px-4 pb-4">
      {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-white/10"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonInsights() {
  return (
    <div className="animate-pulse space-y-3 mt-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="h-3 w-32 rounded bg-white/10 mb-3" />
          <div className="h-2 w-full rounded bg-white/10 mb-2" />
          <div className="h-2 w-3/4 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
