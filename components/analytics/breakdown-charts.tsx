"use client";

import { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { RawApplication } from "@/types/analytics";

const STATUS_COLORS: Record<string, string> = {
  Wishlist: "#60a5fa",
  Applied: "#818cf8",
  Assessment: "#c084fc",
  "HR Interview": "#f59e0b",
  "Technical Interview": "#f97316",
  "Final Interview": "#fb7185",
  Offer: "#10b981",
  Accepted: "#059669",
  Rejected: "#ef4444",
  Ghosted: "#9ca3af",
  Withdrawn: "#6b7280",
};

const FUNNEL_STAGES = [
  { label: "Applied", statuses: ["Wishlist", "Applied", "Assessment", "HR Interview", "Technical Interview", "Final Interview", "Offer", "Accepted", "Rejected", "Ghosted", "Withdrawn"], color: "#818cf8" },
  { label: "Under Review", statuses: ["Assessment", "HR Interview", "Technical Interview", "Final Interview", "Offer", "Accepted"], color: "#c084fc" },
  { label: "Interviewed", statuses: ["HR Interview", "Technical Interview", "Final Interview", "Offer", "Accepted"], color: "#f59e0b" },
  { label: "Offered", statuses: ["Offer", "Accepted"], color: "#10b981" },
  { label: "Accepted", statuses: ["Accepted"], color: "#059669" },
];

interface Props {
  apps: RawApplication[];
}

function DonutChart({ apps }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of apps) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([status, count]) => ({ status, count, pct: Math.round((count / apps.length) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [apps]);

  const total = apps.length;

  if (!mounted) return <div className="h-64 animate-pulse rounded-lg bg-muted/50" />;
  if (total === 0) return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      No data yet
    </div>
  );

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? "#9ca3af"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value, name) => [
              `${value} (${Math.round(((value as number) / total) * 100)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-xs text-muted-foreground">total</span>
      </div>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {data.slice(0, 6).map((d) => (
          <div key={d.status} className="flex items-center gap-1">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: STATUS_COLORS[d.status] ?? "#9ca3af" }}
            />
            <span className="text-[10px] text-muted-foreground">
              {d.status} ({d.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelChart({ apps }: Props) {
  const data = useMemo(() => {
    const total = apps.length || 1;
    return FUNNEL_STAGES.map((stage) => {
      const count = apps.filter((a) => stage.statuses.includes(a.status)).length;
      return { ...stage, count, pct: Math.round((count / total) * 100) };
    });
  }, [apps]);

  const maxCount = data[0]?.count || 1;

  return (
    <div className="flex flex-col gap-2">
      {data.map((stage, i) => (
        <div key={stage.label} className="flex items-center gap-3">
          <div className="w-24 shrink-0 text-right text-xs font-medium text-muted-foreground">
            {stage.label}
          </div>
          <div className="relative flex-1 overflow-hidden rounded-full bg-muted/40 h-7">
            <div
              className="flex h-full items-center justify-end rounded-full pr-2.5 transition-all duration-500"
              style={{
                width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0)}%`,
                background: stage.color,
              }}
            >
              {stage.count > 0 && (
                <span className="text-[10px] font-bold text-white">
                  {stage.count}
                </span>
              )}
            </div>
          </div>
          <div className="w-8 shrink-0 text-right text-xs text-muted-foreground">
            {stage.pct}%
          </div>
          {i < data.length - 1 && (
            <div className="absolute" />
          )}
        </div>
      ))}
      <p className="mt-1 text-[10px] text-muted-foreground/60">
        Based on current status — shows cumulative pipeline
      </p>
    </div>
  );
}

export function BreakdownCharts({ apps }: Props) {
  return (
    <>
      {/* Donut chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Status Breakdown</h3>
          <p className="text-xs text-muted-foreground">Distribution across all statuses</p>
        </div>
        <DonutChart apps={apps} />
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Application Funnel</h3>
          <p className="text-xs text-muted-foreground">Hiring pipeline progression</p>
        </div>
        <FunnelChart apps={apps} />
      </div>
    </>
  );
}
