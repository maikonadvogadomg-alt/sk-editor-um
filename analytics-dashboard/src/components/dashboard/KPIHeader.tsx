import React from "react";
import { useGetMetricsSummary, getGetMetricsSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/format";

export function KPIHeader() {
  const { data: metrics, isLoading } = useGetMetricsSummary({
    query: { queryKey: getGetMetricsSummaryQueryKey() }
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    { label: "MRR", value: formatCurrency(metrics.mrr), growth: metrics.mrrGrowth, isGood: metrics.mrrGrowth > 0 },
    { label: "ARR", value: formatCurrency(metrics.arr), growth: metrics.mrrGrowth, isGood: metrics.mrrGrowth > 0 },
    { label: "Total Users", value: formatNumber(metrics.totalUsers), growth: metrics.userGrowth, isGood: metrics.userGrowth > 0 },
    { label: "Active (MAU)", value: formatNumber(metrics.activeUsers), growth: null, isGood: true },
    { label: "DAU/MAU", value: formatPercentage(metrics.dauMauRatio), growth: null, isGood: true },
    { label: "Churn Rate", value: formatPercentage(metrics.churnRate), growth: null, isGood: metrics.churnRate < 5, isReversed: true },
    { label: "Avg Session", value: `${metrics.avgSessionMinutes}m`, growth: null, isGood: true },
    { label: "NPS", value: metrics.nps.toString(), growth: null, isGood: metrics.nps > 30 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
      {kpis.map((kpi, i) => (
        <Card key={i} className="shadow-sm bg-card hover:border-primary/50 transition-colors border-card-border">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{kpi.label}</p>
            <h3 className="text-xl font-semibold text-foreground font-mono">{kpi.value}</h3>
            {kpi.growth !== null && (
              <div className={`flex items-center text-xs mt-1 font-medium ${kpi.isGood ? 'text-emerald-600' : 'text-destructive'}`}>
                {kpi.growth > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(kpi.growth)}%
              </div>
            )}
            {kpi.growth === null && (
              <div className="h-4 mt-1" /> // Spacer for alignment
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
