import React from "react";
import { useGetUserGrowth, getGetUserGrowthQueryKey, useGetUserAcquisition, getGetUserAcquisitionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { formatNumber } from "@/lib/format";

export function UsersSection() {
  const { data: growthData, isLoading: isLoadingGrowth } = useGetUserGrowth({ months: 12 }, { query: { queryKey: getGetUserGrowthQueryKey({ months: 12 }) }});
  const { data: acqData, isLoading: isLoadingAcq } = useGetUserAcquisition({ query: { queryKey: getGetUserAcquisitionQueryKey() }});

  if (isLoadingGrowth || isLoadingAcq || !growthData || !acqData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="shadow-sm border-card-border">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Active User Growth</CardTitle>
          <CardDescription>Total and active users over time</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-8">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatNumber}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="totalUsers" name="Total Users" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-card-border">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Acquisition Channels</CardTitle>
          <CardDescription>Where new users are coming from</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-8">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acqData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="channel" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'users' ? formatNumber(value) : `${value.toFixed(1)}%`,
                    name === 'users' ? 'Users' : 'Conversion Rate'
                  ]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                />
                <Bar dataKey="users" name="Users" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
