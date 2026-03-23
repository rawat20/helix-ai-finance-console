/** Inline alerts for API connectivity, successful upload, or upload errors (non-blocking). */
export function DashboardBanners({
  apiUnavailable,
  uploadSuccess,
  uploadError,
}: {
  apiUnavailable: boolean;
  uploadSuccess: string | null;
  uploadError: string | null;
}) {
  return (
    <>
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
    </>
  );
}
