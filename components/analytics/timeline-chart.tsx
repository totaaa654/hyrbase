"use client";

import { useMemo, useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import type { RawApplication } from "@/types/analytics";

type Granularity = "daily" | "weekly" | "monthly";

const RANGE_OPTIONS = [
  { label: "7D", value: "7d", gran: "daily" as Granularity },
  { label: "30D", value: "30d", gran: "daily" as Granularity },
  { label: "90D", value: "90d", gran: "weekly" as Granularity },
  { label: "1Y", value: "1y", gran: "monthly" as Granularity },
  { label: "All", value: "all", gran: "monthly" as Granularity },
];

function toKey(date: Date, gran: Granularity): string {
  if (gran === "monthly") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (gran === "weekly") {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay()); // Sunday start
    return d.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function buildTimeSeries(apps: RawApplication[], range: string, gran: Granularity) {
  const now = Date.now();
  const cutoff =
    range === "7d" ? now - 7 * 86400000 :
    range === "30d" ? now - 30 * 86400000 :
    range === "90d" ? now - 90 * 86400000 :
    range === "1y" ? now - 365 * 86400000 :
    0;

  const filtered = cutoff > 0
    ? apps.filter((a) => new Date(a.date_applied).getTime() >= cutoff)
    : apps;

  const counts = new Map<string, number>();
  for (const a of filtered) {
    const key = toKey(new Date(a.date_applied), gran);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Fill gaps with 0
  if (filtered.length === 0) return [];
  const sorted = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([key, count]) => ({
    date: gran === "monthly"
      ? new Date(key + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      : gran === "weekly"
        ? new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count,
  }));
}

interface Props {
  apps: RawApplication[];
}

export function TimelineChart({ apps }: Props) {
  const [range, setRange] = useState("30d");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const gran = RANGE_OPTIONS.find((r) => r.value === range)?.gran ?? "daily";
  const data = useMemo(() => buildTimeSeries(apps, range, gran), [apps, range, gran]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Applications Over Time</h3>
          <p className="text-xs text-muted-foreground">Applications submitted per period</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!mounted ? (
        <div className="h-52 animate-pulse rounded-lg bg-muted/50" />
      ) : data.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
          No applications in this range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={208}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.558 0.288 293)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="oklch(0.558 0.288 293)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "oklch(0.558 0.288 293)" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Applications"
              stroke="oklch(0.558 0.288 293)"
              strokeWidth={2}
              fill="url(#appGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "oklch(0.558 0.288 293)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
