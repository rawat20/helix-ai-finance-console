export function StatCard({
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
      {helper ? <p className="text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}
