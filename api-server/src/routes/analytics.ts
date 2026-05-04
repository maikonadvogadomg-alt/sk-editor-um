import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

// --- Seed data helpers ---

function generateMonthLabels(count: number): string[] {
  const months = [];
  const now = new Date(2026, 3, 1); // April 2026
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      d.toLocaleString("default", { month: "short" }) + " " + d.getFullYear(),
    );
  }
  return months;
}

function generateDayLabels(count: number): string[] {
  const days = [];
  const now = new Date(2026, 3, 15);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

// --- /metrics/summary ---
router.get("/metrics/summary", (_req: Request, res: Response) => {
  res.json({
    mrr: 142800,
    mrrGrowth: 8.4,
    arr: 1713600,
    totalUsers: 18420,
    userGrowth: 11.2,
    activeUsers: 9840,
    dauMauRatio: 31.5,
    churnRate: 2.1,
    avgSessionMinutes: 18.4,
    nps: 62,
  });
});

// --- /revenue/monthly ---
router.get("/revenue/monthly", (req: Request, res: Response) => {
  const months = Math.min(
    Number(req.query["months"] ?? 12),
    24,
  );
  const labels = generateMonthLabels(months);

  let mrr = 62000;
  const data = labels.map((month) => {
    const newMrr = Math.round(6000 + Math.random() * 4000);
    const expansionMrr = Math.round(1500 + Math.random() * 2000);
    const churnedMrr = -Math.round(1200 + Math.random() * 1800);
    mrr = mrr + newMrr + expansionMrr + churnedMrr;
    return {
      month,
      mrr,
      arr: mrr * 12,
      newMrr,
      expansionMrr,
      churnedMrr,
    };
  });

  res.json(data);
});

// --- /revenue/breakdown ---
router.get("/revenue/breakdown", (_req: Request, res: Response) => {
  const plans = [
    { plan: "Enterprise", mrr: 71400, customers: 48, percentage: 50 },
    { plan: "Growth", mrr: 42840, customers: 214, percentage: 30 },
    { plan: "Starter", mrr: 21420, customers: 714, percentage: 15 },
    { plan: "Free", mrr: 7140, customers: 2100, percentage: 5 },
  ];
  res.json(plans);
});

// --- /users/growth ---
router.get("/users/growth", (req: Request, res: Response) => {
  const months = Math.min(Number(req.query["months"] ?? 12), 24);
  const labels = generateMonthLabels(months);

  let totalUsers = 5200;
  const data = labels.map((month) => {
    const newUsers = Math.round(800 + Math.random() * 600);
    const churnedUsers = Math.round(80 + Math.random() * 120);
    totalUsers += newUsers - churnedUsers;
    const activeUsers = Math.round(totalUsers * (0.48 + Math.random() * 0.12));
    return {
      month,
      totalUsers,
      newUsers,
      activeUsers,
      churnedUsers,
    };
  });

  res.json(data);
});

// --- /users/acquisition ---
router.get("/users/acquisition", (_req: Request, res: Response) => {
  const channels = [
    { channel: "Organic Search", users: 5840, percentage: 31.7, conversionRate: 3.2 },
    { channel: "Referral", users: 4210, percentage: 22.9, conversionRate: 8.7 },
    { channel: "Paid Ads", users: 3680, percentage: 20.0, conversionRate: 2.1 },
    { channel: "Product Hunt", users: 2140, percentage: 11.6, conversionRate: 5.4 },
    { channel: "Social Media", users: 1490, percentage: 8.1, conversionRate: 1.8 },
    { channel: "Direct", users: 1060, percentage: 5.8, conversionRate: 4.9 },
  ];
  res.json(channels);
});

// --- /engagement/overview ---
router.get("/engagement/overview", (req: Request, res: Response) => {
  const days = Math.min(Number(req.query["days"] ?? 30), 90);
  const labels = generateDayLabels(days);

  const data = labels.map((date) => ({
    date,
    dau: Math.round(2800 + Math.random() * 800 + (Math.sin(labels.indexOf(date) / 7) * 300)),
    sessions: Math.round(3400 + Math.random() * 1000),
    avgSessionMinutes: parseFloat((15 + Math.random() * 8).toFixed(1)),
    eventsPerSession: parseFloat((12 + Math.random() * 6).toFixed(1)),
  }));

  res.json(data);
});

// --- /engagement/features ---
router.get("/engagement/features", (_req: Request, res: Response) => {
  const features = [
    { feature: "Dashboard", usageCount: 142800, uniqueUsers: 9120, adoptionRate: 92.7 },
    { feature: "Reports", usageCount: 84200, uniqueUsers: 6840, adoptionRate: 69.5 },
    { feature: "Integrations", usageCount: 52100, uniqueUsers: 5210, adoptionRate: 53.0 },
    { feature: "Team Collaboration", usageCount: 38400, uniqueUsers: 4120, adoptionRate: 41.9 },
    { feature: "API Access", usageCount: 29700, uniqueUsers: 2480, adoptionRate: 25.2 },
    { feature: "Custom Alerts", usageCount: 21300, uniqueUsers: 1870, adoptionRate: 19.0 },
    { feature: "Data Export", usageCount: 14800, uniqueUsers: 1340, adoptionRate: 13.6 },
    { feature: "White-label", usageCount: 6200, uniqueUsers: 480, adoptionRate: 4.9 },
  ];
  res.json(features);
});

// --- /engagement/retention ---
router.get("/engagement/retention", (_req: Request, res: Response) => {
  const cohorts = [
    { cohortMonth: "Nov 2025", cohortSize: 1240, week1: 78.2, week2: 62.4, week4: 51.8, week8: 44.1, week12: 39.6 },
    { cohortMonth: "Dec 2025", cohortSize: 1380, week1: 80.1, week2: 64.7, week4: 53.2, week8: 45.8, week12: 41.2 },
    { cohortMonth: "Jan 2026", cohortSize: 1520, week1: 79.4, week2: 63.1, week4: 52.6, week8: 46.3, week12: null },
    { cohortMonth: "Feb 2026", cohortSize: 1690, week1: 81.8, week2: 66.2, week4: 54.9, week8: null, week12: null },
    { cohortMonth: "Mar 2026", cohortSize: 1820, week1: 82.5, week2: 67.4, week4: null, week8: null, week12: null },
    { cohortMonth: "Apr 2026", cohortSize: 940, week1: 83.1, week2: null, week4: null, week8: null, week12: null },
  ];
  res.json(cohorts);
});

export default router;
