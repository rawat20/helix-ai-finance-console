export function UploadProgressOverlay({ fileName }: { fileName: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full">
      <div className="relative h-10 w-10">
        <svg className="animate-spin h-10 w-10 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-indigo-200">Processing {fileName}…</p>
      <p className="text-xs text-slate-400">Parsing · Detecting anomalies · Saving to database</p>
    </div>
  );
}
