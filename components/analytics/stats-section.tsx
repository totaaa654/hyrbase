"use client";

import { useMemo } from "react";
import { TrendingUp, Star } from "lucide-react";
import type { RawApplication, RawAnalysis, RawResume } from "@/types/analytics";
import { cn } from "@/lib/utils";

// ── Response Rate ─────────────────────────────────────────────────────────────

const RESPONSE_STATUSES = new Set([
  "Assessment", "HR Interview", "Technical Interview", "Final Interview",
  "Offer", "Accepted", "Rejected", "Ghosted", "Withdrawn",
]);

function ResponseStats({ apps }: { apps: RawApplication[] }) {
  const totalApplied = apps.filter((a) => a.status !== "Wishlist").length;
  const responses = apps.filter((a) => RESPONSE_STATUSES.has(a.status)).length;
  const rate = totalApplied > 0 ? Math.round((responses / totalApplied) * 100) : 0;

  const stats = [
    { label: "Submitted", value: totalApplied },
    { label: "Responded", value: responses },
    { label: "Rate", value: `${rate}%` },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Response Rate</h3>
      </div>
      <div className="mb-4 flex items-center gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${rate}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        {rate}% of submitted applications received a response
      </p>
    </div>
  );
}

// ── Resume Performance ────────────────────────────────────────────────────────

interface ResumeRow {
  id: string;
  name: string;
  avgAts: number;
  avgMatch: number;
  usage: number;
  isBest: boolean;
}

function ResumePerformance({
  apps,
  analyses,
  resumes,
}: {
  apps: RawApplication[];
  analyses: RawAnalysis[];
  resumes: RawResume[];
}) {
  const rows = useMemo((): ResumeRow[] => {
    if (resumes.length === 0) return [];

    const resumeMap = new Map(resumes.map((r) => [r.id, r.display_name]));
    const usageMap = new Map<string, number>();
    for (const a of apps) {
      if (a.resume_id) usageMap.set(a.resume_id, (usageMap.get(a.resume_id) ?? 0) + 1);
    }

    const byResume = new Map<string, { atsList: number[]; matchList: number[] }>();
    for (const a of analyses) {
      if (!a.resume_id) continue;
      const entry = byResume.get(a.resume_id) ?? { atsList: [], matchList: [] };
      entry.atsList.push(a.ats_score);
      entry.matchList.push(a.resume_match);
      byResume.set(a.resume_id, entry);
    }

    const rows: ResumeRow[] = resumes.map((r) => {
      const entry = byResume.get(r.id);
      const avg = (arr: number[]) =>
        arr.length > 0 ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : 0;
      return {
        id: r.id,
        name: r.display_name,
        avgAts: avg(entry?.atsList ?? []),
        avgMatch: avg(entry?.matchList ?? []),
        usage: usageMap.get(r.id) ?? 0,
        isBest: false,
      };
    });

    // Mark best by avgAts
    if (rows.length > 0) {
      const best = rows.reduce((a, b) => (a.avgAts >= b.avgAts ? a : b));
      if (best.avgAts > 0) best.isBest = true;
    }

    return rows.sort((a, b) => b.avgAts - a.avgAts);
  }, [apps, analyses, resumes]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Resume Performance</h3>
        <p className="text-sm text-muted-foreground">No resumes uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Star className="size-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Resume Performance</h3>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left font-medium text-muted-foreground">Resume</th>
              <th className="pb-2 text-center font-medium text-muted-foreground">ATS Score</th>
              <th className="pb-2 text-center font-medium text-muted-foreground">Match</th>
              <th className="pb-2 text-right font-medium text-muted-foreground">Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className={cn(row.isBest && "bg-primary/5")}>
                <td className="py-2.5 pr-2 font-medium">
                  <div className="flex items-center gap-1.5">
                    {row.isBest && (
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                    )}
                    <span className="truncate max-w-[140px]">{row.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  {row.avgAts > 0 ? (
                    <span
                      className={cn(
                        "font-semibold",
                        row.avgAts >= 80 ? "text-emerald-400" :
                        row.avgAts >= 60 ? "text-amber-400" : "text-red-400"
                      )}
                    >
                      {row.avgAts}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 text-center">
                  {row.avgMatch > 0 ? (
                    <span className="font-semibold text-primary">{row.avgMatch}%</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 text-right text-muted-foreground">{row.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Salary Insights ───────────────────────────────────────────────────────────

const RATE_TO_MONTHLY: Record<string, number> = {
  Hourly: 160,
  Daily: 22,
  Weekly: 4.33,
  Monthly: 1,
  Yearly: 1 / 12,
};

function SalaryInsights({ apps }: { apps: RawApplication[] }) {
  const stats = useMemo(() => {
    const salaryApps = apps
      .filter((a) => a.salary_amount && parseFloat(a.salary_amount) > 0)
      .map((a) => ({
        monthly:
          parseFloat(a.salary_amount!) *
          (RATE_TO_MONTHLY[a.salary_rate ?? "Monthly"] ?? 1),
        currency: a.salary_currency ?? "USD",
        raw: parseFloat(a.salary_amount!),
        rate: a.salary_rate ?? "Monthly",
      }));

    if (salaryApps.length === 0) return null;

    // Group by most common currency
    const currCount: Record<string, number> = {};
    for (const s of salaryApps) currCount[s.currency] = (currCount[s.currency] ?? 0) + 1;
    const mainCurr = Object.entries(currCount).sort((a, b) => b[1] - a[1])[0][0];
    const filtered = salaryApps.filter((s) => s.currency === mainCurr);

    const monthly = filtered.map((s) => s.monthly);
    const min = Math.round(Math.min(...monthly));
    const max = Math.round(Math.max(...monthly));
    const avg = Math.round(monthly.reduce((s, n) => s + n, 0) / monthly.length);

    return { min, max, avg, currency: mainCurr, count: filtered.length };
  }, [apps]);

  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-2 text-sm font-semibold">Salary Insights</h3>
        <p className="text-sm text-muted-foreground">
          Add expected salaries to your applications to see insights.
        </p>
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: stats.currency, maximumFractionDigits: 0 }).format(n);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Salary Insights</h3>
        <p className="text-xs text-muted-foreground">
          Monthly equivalent across {stats.count} application{stats.count !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Minimum", value: fmt(stats.min), color: "text-muted-foreground" },
          { label: "Average", value: fmt(stats.avg), color: "text-primary font-bold" },
          { label: "Maximum", value: fmt(stats.max), color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg bg-muted/40 p-3 text-center">
            <p className={cn("text-sm font-semibold", color)}>{value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {/* Range bar */}
      <div className="mt-4">
        <div className="relative h-2 rounded-full bg-muted/50">
          <div
            className="absolute h-full rounded-full bg-gradient-to-r from-primary/50 to-primary"
            style={{ left: "0%", width: "100%" }}
          />
          <div
            className="absolute size-3 -translate-y-0.5 rounded-full border-2 border-primary bg-card"
            style={{ left: `${Math.round(((stats.avg - stats.min) / Math.max(stats.max - stats.min, 1)) * 100)}%`, transform: "translateX(-50%) translateY(-2px)" }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
          <span>{fmt(stats.min)}</span>
          <span>{fmt(stats.max)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

interface Props {
  apps: RawApplication[];
  analyses: RawAnalysis[];
  resumes: RawResume[];
}

export function StatsSection({ apps, analyses, resumes }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <ResponseStats apps={apps} />
      <ResumePerformance apps={apps} analyses={analyses} resumes={resumes} />
      <SalaryInsights apps={apps} />
    </div>
  );
}
