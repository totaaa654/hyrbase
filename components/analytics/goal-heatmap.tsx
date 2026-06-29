"use client";

import { useMemo, useState, useTransition } from "react";
import { Target, Flame } from "lucide-react";
import { setWeeklyGoal } from "@/app/(dashboard)/analytics/actions";
import type { RawApplication } from "@/types/analytics";

// ── Weekly Goal ───────────────────────────────────────────────────────────────

function getWeekStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
  return d;
}

function WeeklyGoal({
  apps,
  weeklyGoal,
}: {
  apps: RawApplication[];
  weeklyGoal: number;
}) {
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState(String(weeklyGoal));
  const [optimisticGoal, setOptimisticGoal] = useState(weeklyGoal);
  const [isPending, startTransition] = useTransition();

  const weekStart = getWeekStart();
  const thisWeek = apps.filter(
    (a) => new Date(a.date_applied).getTime() >= weekStart.getTime()
  ).length;

  const pct = Math.min(Math.round((thisWeek / Math.max(optimisticGoal, 1)) * 100), 100);
  const remaining = Math.max(optimisticGoal - thisWeek, 0);

  function saveGoal() {
    const val = Math.max(1, Math.min(100, parseInt(goalInput, 10) || weeklyGoal));
    setGoalInput(String(val));
    setOptimisticGoal(val);
    setEditing(false);
    startTransition(async () => {
      await setWeeklyGoal(val);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Weekly Goal</h3>
        </div>
        <button
          onClick={() => { setEditing(true); setGoalInput(String(optimisticGoal)); }}
          className="text-[10px] text-primary hover:underline"
        >
          Edit goal
        </button>
      </div>

      {editing ? (
        <div className="mb-4 flex items-center gap-2">
          <input
            autoFocus
            type="number"
            min={1}
            max={100}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveGoal(); if (e.key === "Escape") setEditing(false); }}
            className="w-20 rounded-lg border border-primary bg-background px-2 py-1 text-sm text-foreground outline-none"
          />
          <button
            onClick={saveGoal}
            disabled={isPending}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mb-3 flex items-end gap-3">
          <div className="text-center">
            <p className="text-3xl font-bold">{thisWeek}</p>
            <p className="text-[10px] text-muted-foreground">applied this week</p>
          </div>
          <div className="mb-1 text-muted-foreground">/</div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-muted-foreground">{optimisticGoal}</p>
            <p className="text-[10px] text-muted-foreground">goal</p>
          </div>
          {pct >= 100 && (
            <div className="mb-1 ml-auto flex items-center gap-1 text-emerald-400">
              <Flame className="size-4" />
              <span className="text-xs font-medium">Goal met!</span>
            </div>
          )}
        </div>
      )}

      <div className="h-2.5 overflow-hidden rounded-full bg-muted/50">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 100 ? "bg-emerald-400" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{pct}% complete</span>
        {remaining > 0 && <span>{remaining} more to go</span>}
      </div>
    </div>
  );
}

// ── Activity Heatmap ──────────────────────────────────────────────────────────

const INTENSITY_CLASSES = [
  "bg-muted/40",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/65",
  "bg-primary",
];

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function ActivityHeatmap({ apps }: { apps: RawApplication[] }) {
  const { weeks, months, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // Adjust to Sunday
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    const countMap = new Map<string, number>();
    for (const app of apps) {
      const key = app.date_applied.slice(0, 10);
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    const weeks: { date: Date; count: number }[][] = [];
    const months: { label: string; colStart: number }[] = [];
    let cur = new Date(start);
    let col = 0;
    let lastMonth = -1;

    while (cur <= today) {
      const week: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const key = cur.toISOString().slice(0, 10);
        week.push({ date: new Date(cur), count: countMap.get(key) ?? 0 });

        if (cur.getMonth() !== lastMonth) {
          months.push({
            label: cur.toLocaleDateString("en-US", { month: "short" }),
            colStart: col,
          });
          lastMonth = cur.getMonth();
        }
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
      col++;
    }

    const maxCount = Math.max(...Array.from(countMap.values()), 1);
    return { weeks, months, maxCount };
  }, [apps]);

  const totalThisYear = useMemo(() => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    return apps.filter((a) => a.date_applied >= yearStart).length;
  }, [apps]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Activity Heatmap</h3>
          <p className="text-xs text-muted-foreground">
            {totalThisYear} application{totalThisYear !== 1 ? "s" : ""} in the past year
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {INTENSITY_CLASSES.map((cls, i) => (
            <span key={i} className={`inline-block size-2.5 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="mb-1 flex gap-0.5 pl-6">
            {weeks.map((_, col) => {
              const month = months.find((m) => m.colStart === col);
              return (
                <div key={col} className="w-3 text-[8px] text-muted-foreground">
                  {month?.label ?? ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 pr-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="flex h-3 w-3 items-center justify-center text-[8px] text-muted-foreground">
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={`${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}: ${day.count} application${day.count !== 1 ? "s" : ""}`}
                    className={`size-3 rounded-sm transition-opacity hover:opacity-80 ${INTENSITY_CLASSES[getIntensity(day.count)]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

interface Props {
  apps: RawApplication[];
  weeklyGoal: number;
}

export function GoalHeatmap({ apps, weeklyGoal }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <WeeklyGoal apps={apps} weeklyGoal={weeklyGoal} />
      <div className="lg:col-span-2">
        <ActivityHeatmap apps={apps} />
      </div>
    </div>
  );
}
