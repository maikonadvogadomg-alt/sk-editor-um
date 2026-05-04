import React from "react";
import { useGetMonthlyRevenue, getGetMonthlyRevenueQueryKey, useGetRevenueBreakdown, getGetRevenueBreakdownQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from "recharts";
import { formatCurrency } from "@/lib/format";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function RevenueSection() {
  const { data: monthlyData, isLoading: isLoadingMonthly } = useGetMonthlyRevenue({ months: 12 }, { query: { queryKey: getGetMonthlyRevenueQueryKey({ months: 12 }) }});
  const { data: breakdownData, isLoading: isLoadingBreakdown } = useGetRevenueBreakdown({ query: { queryKey: getGetRevenueBreakdownQueryKey() }});

  if (isLoadingMonthly || isLoadingBreakdown || !monthlyData || !breakdownData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/3 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="col-span-1 xl:col-span-2 shadow-sm border-card-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">MRR Growth & Movement</CardTitle>
          <CardDescription>Monthly recurring revenue over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-8">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  tickFormatter={(val) => formatCurrency(val)}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "MRR"]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                />
                <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 h-[150px] w-full border-t border-border/50 pt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Net MRR Movement</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const formatted = formatCurrency(Math.abs(value));
                    return [value < 0 ? `-${formatted}` : formatted, name === 'newMrr' ? 'New' : name === 'expansionMrr' ? 'Expansion' : 'Churn'];
                  }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="newMrr" stackId="a" fill="hsl(var(--chart-5))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expansionMrr" stackId="a" fill="hsl(var(--chart-3))" />
                <Bar dataKey="churnedMrr" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 shadow-sm border-card-border flex flex-col">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Revenue by Plan</CardTitle>
          <CardDescription>Current MRR distribution</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="h-[250px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="mrr"
                  stroke="none"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4 mt-auto">
            {breakdownData.map((plan, i) => (
              <div key={plan.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="font-medium text-sm">{plan.plan}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-sm">{formatCurrency(plan.mrr)}</div>
                  <div className="text-xs text-muted-foreground">{plan.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
