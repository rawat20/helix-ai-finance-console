"use client";

import {
  CategoryDonutAndTable,
  DashboardBanners,
  DashboardNav,
  InsightsModal,
  KpiSection,
  UploadAndMonthlyChart,
} from "@/components/dashboard";
import { useExpenseDashboard } from "@/hooks/useExpenseDashboard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Protected expense dashboard (middleware enforces auth on /dashboard). */
export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

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

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-emerald-400" />
      </div>
    );
  }

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
