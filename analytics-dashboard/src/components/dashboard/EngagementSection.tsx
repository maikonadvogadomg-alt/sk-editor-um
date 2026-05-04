import React from "react";
import { useGetEngagementOverview, getGetEngagementOverviewQueryKey, useGetFeatureEngagement, getGetFeatureEngagementQueryKey, useGetRetentionCohorts, getGetRetentionCohortsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { formatNumber } from "@/lib/format";

function getCohortColor(percentage: number) {
  if (percentage >= 80) return 'bg-emerald-500/90 text-emerald-950 dark:text-emerald-50 font-bold';
  if (percentage >= 60) return 'bg-emerald-400/70 text-emerald-950 dark:text-emerald-50 font-medium';
  if (percentage >= 40) return 'bg-emerald-300/50 text-emerald-950 dark:text-emerald-50 font-medium';
  if (percentage >= 20) return 'bg-emerald-200/30 text-emerald-950 dark:text-emerald-100';
  if (percentage > 0) return 'bg-emerald-100/20 text-emerald-950/70 dark:text-emerald-200/70';
  return 'bg-muted/20 text-muted-foreground';
}

export function EngagementSection() {
  const { data: overview, isLoading: isOverviewLoading } = useGetEngagementOverview({ days: 30 }, { query: { queryKey: getGetEngagementOverviewQueryKey({ days: 30 }) }});
  const { data: features, isLoading: isFeaturesLoading } = useGetFeatureEngagement({ query: { queryKey: getGetFeatureEngagementQueryKey() }});
  const { data: cohorts, isLoading: isCohortsLoading } = useGetRetentionCohorts({ query: { queryKey: getGetRetentionCohortsQueryKey() }});

  if (isOverviewLoading || isFeaturesLoading || isCohortsLoading || !overview || !features || !cohorts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Retention Cohort Heatmap */}
      <Card className="shadow-sm border-card-border">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Retention Cohorts</CardTitle>
          <CardDescription>User retention by signup month</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-6 overflow-x-auto">
          <div className="min-w-[700px]">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="py-3 px-4 font-semibold text-muted-foreground w-32 border-b border-border/50">Cohort</th>
                  <th className="py-3 px-4 font-semibold text-muted-foreground w-24 border-b border-border/50">Users</th>
                  <th className="py-3 px-2 font-medium text-center text-muted-foreground border-b border-border/50">Week 1</th>
                  <th className="py-3 px-2 font-medium text-center text-muted-foreground border-b border-border/50">Week 2</th>
                  <th className="py-3 px-2 font-medium text-center text-muted-foreground border-b border-border/50">Week 4</th>
                  <th className="py-3 px-2 font-medium text-center text-muted-foreground border-b border-border/50">Week 8</th>
                  <th className="py-3 px-2 font-medium text-center text-muted-foreground border-b border-border/50">Week 12</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort, i) => (
                  <tr key={cohort.cohortMonth} className="group hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-foreground whitespace-nowrap">{cohort.cohortMonth}</td>
                    <td className="py-2.5 px-4 text-muted-foreground font-mono">{formatNumber(cohort.cohortSize)}</td>
                    <td className="py-1 px-1 text-center">
                      <div className={`h-9 w-full flex items-center justify-center rounded-sm text-xs transition-colors duration-300 ${getCohortColor(cohort.week1)}`}>
                        {cohort.week1.toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-1 px-1 text-center">
                      <div className={`h-9 w-full flex items-center justify-center rounded-sm text-xs transition-colors duration-300 ${getCohortColor(cohort.week2)}`}>
                        {cohort.week2.toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-1 px-1 text-center">
                      <div className={`h-9 w-full flex items-center justify-center rounded-sm text-xs transition-colors duration-300 ${getCohortColor(cohort.week4)}`}>
                        {cohort.week4.toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-1 px-1 text-center">
                      <div className={`h-9 w-full flex items-center justify-center rounded-sm text-xs transition-colors duration-300 ${getCohortColor(cohort.week8)}`}>
                        {cohort.week8.toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-1 px-1 text-center">
                      <div className={`h-9 w-full flex items-center justify-center rounded-sm text-xs transition-colors duration-300 ${getCohortColor(cohort.week12)}`}>
                        {cohort.week12.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-card-border">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Daily Active Users</CardTitle>
            <CardDescription>Last 30 days of activity</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                  />
                  <Area type="monotone" dataKey="dau" name="DAU" stroke="hsl(var(--chart-2))" strokeWidth={3} fillOpacity={1} fill="url(#colorDau)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-card-border flex flex-col">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Feature Adoption</CardTitle>
            <CardDescription>Most used features this month</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border/50">
              {features.map((feature, i) => (
                <div key={feature.feature} className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{feature.feature}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatNumber(feature.usageCount)} uses by {formatNumber(feature.uniqueUsers)} users
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="font-mono text-sm font-medium">{feature.adoptionRate.toFixed(1)}%</div>
                    <div className="w-24 h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${feature.adoptionRate}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
