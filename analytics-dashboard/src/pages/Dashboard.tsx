import React, { useState } from "react";
import { KPIHeader } from "@/components/dashboard/KPIHeader";
import { RevenueSection } from "@/components/dashboard/RevenueSection";
import { UsersSection } from "@/components/dashboard/UsersSection";
import { EngagementSection } from "@/components/dashboard/EngagementSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, CreditCard, Users, LineChart, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("revenue");

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Nexus Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Data
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-2 shadow-sm text-xs font-medium">
              <RefreshCcw className="w-3 h-3" />
              Sync
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Overview</h1>
          <p className="text-muted-foreground text-sm">Your business metrics at a glance. Updated in real-time.</p>
        </div>

        <KPIHeader />

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="revenue" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <CreditCard className="w-4 h-4" />
                  Revenue
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="engagement" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <LineChart className="w-4 h-4" />
                  Engagement
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="revenue" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <RevenueSection />
            </TabsContent>
            <TabsContent value="users" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <UsersSection />
            </TabsContent>
            <TabsContent value="engagement" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <EngagementSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
