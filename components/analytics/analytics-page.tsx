"use client";

import { useState, useMemo } from "react";
import { BarChart2, Calendar } from "lucide-react";
import type { AnalyticsPayload, CalendarEvent, RawApplication } from "@/types/analytics";
import { OverviewCards } from "./overview-cards";
import { TimelineChart } from "./timeline-chart";
import { BreakdownCharts } from "./breakdown-charts";
import { TopCharts } from "./top-charts";
import { StatsSection } from "./stats-section";
import { GoalHeatmap } from "./goal-heatmap";
import { InsightsPanel } from "./insights-panel";
import { PlannerTab } from "./planner-tab";
import { cn } from "@/lib/utils";

const DATE_RANGES = [
  { label: "All time", value: "all" },
  { label: "Last 30d", value: "30d" },
  { label: "Last 90d", value: "90d" },
  { label: "This year", value: "year" },
] as const;

type DateRange = typeof DATE_RANGES[number]["value"];

function filterByDate(apps: RawApplication[], range: DateRange): RawApplication[] {
  if (range === "all") return apps;
  const now = Date.now();
  const cutoff =
    range === "30d" ? now - 30 * 86400000 :
    range === "90d" ? now - 90 * 86400000 :
    new Date(new Date().getFullYear(), 0, 1).getTime();
  return apps.filter((a) => new Date(a.date_applied).getTime() >= cutoff);
}

interface Props {
  payload: AnalyticsPayload;
  initialUpcoming: CalendarEvent[];
}

export function AnalyticsPage({ payload, initialUpcoming }: Props) {
  const [tab, setTab] = useState<"analytics" | "planner">("analytics");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredApps = useMemo(() => {
    let apps = filterByDate(payload.applications, dateRange);
    if (statusFilter !== "all") apps = apps.filter((a) => a.status === statusFilter);
    return apps;
  }, [payload.applications, dateRange, statusFilter]);

  const filteredAnalyses = useMemo(() => {
    const ids = new Set(filteredApps.map((a) => a.id));
    return payload.analyses.filter((a) => ids.has(a.application_id));
  }, [filteredApps, payload.analyses]);

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(payload.applications.map((a) => a.status))).sort(),
    [payload.applications]
  );

  const tabs = [
    { key: "analytics" as const, label: "Analytics", icon: BarChart2 },
    { key: "planner" as const, label: "Planner", icon: Calendar },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-card px-4 pt-4 pb-0 sm:px-6 sm:pt-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 sm:items-end">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Analytics & Planner</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Insights and planning tools for your job search
            </p>
          </div>
          {/* Filters — only shown on analytics tab */}
          {tab === "analytics" && (
            <div className="flex flex-wrap items-center gap-2 pb-0.5">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DATE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All statuses</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="mt-3 flex gap-1 sm:mt-4">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {tab === "analytics" ? (
          <div className="mx-auto max-w-7xl space-y-6 p-6">
            <OverviewCards apps={filteredApps} />
            <TimelineChart apps={filteredApps} />
            <div className="grid gap-6 lg:grid-cols-2">
              <BreakdownCharts apps={filteredApps} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <TopCharts apps={filteredApps} />
            </div>
            <StatsSection
              apps={filteredApps}
              analyses={filteredAnalyses}
              resumes={payload.resumes}
            />
            <GoalHeatmap
              apps={payload.applications}
              weeklyGoal={payload.weeklyGoal}
            />
            <InsightsPanel
              apps={filteredApps}
              analyses={filteredAnalyses}
              resumes={payload.resumes}
            />
          </div>
        ) : (
          <PlannerTab
            apps={payload.applications}
            weeklyGoal={payload.weeklyGoal}
            initialUpcoming={initialUpcoming}
          />
        )}
      </div>
    </div>
  );
}
