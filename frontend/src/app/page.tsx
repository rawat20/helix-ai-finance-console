"use client";

/**
 * Home route: expense dashboard shell. All data fetching and side effects live in
 */
import {
  CategoryDonutAndTable,
  DashboardBanners,
  DashboardNav,
  InsightsModal,
  KpiSection,
  UploadAndMonthlyChart,
} from "@/components/dashboard";
import { useExpenseDashboard } from "@/hooks/useExpenseDashboard";

/** Renders the full-screen expense console: nav, KPIs, upload + chart, category table, insights modal. */
export default function Home() {
  const {
    fileName,
    uploading,
    uploadSuccess,
    uploadError,
    insightsOpen,
    setInsightsOpen,
    isLoading,
    apiUnavailable,
    payload,
    flaggedRate,
    insightsLoading,
    insights,
    recommendations,
    handleUpload,
    handleExport,
  } = useExpenseDashboard();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardNav
          source={payload.source}
          onOpenInsights={() => setInsightsOpen(true)}
          onExport={handleExport}
        />

        <DashboardBanners
          apiUnavailable={apiUnavailable}
          uploadSuccess={uploadSuccess}
          uploadError={uploadError}
        />

        <KpiSection isLoading={isLoading} payload={payload} flaggedRate={flaggedRate} />

        <UploadAndMonthlyChart
          isLoading={isLoading}
          payload={payload}
          uploading={uploading}
          fileName={fileName}
          onUpload={handleUpload}
        />

        <CategoryDonutAndTable isLoading={isLoading} payload={payload} />
      </div>

      <InsightsModal
        open={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        insightsLoading={insightsLoading}
        insights={insights}
        recommendations={recommendations}
      />
    </div>
  );
}
