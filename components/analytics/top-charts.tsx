"use client";

import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RawApplication } from "@/types/analytics";

// ── Skills keyword list ───────────────────────────────────────────────────────

const SKILL_KEYWORDS = [
  "React", "TypeScript", "JavaScript", "Next.js", "Node.js", "Python", "Java",
  "Vue.js", "Angular", "Svelte", "Go", "Rust", "C++", "C#", "PHP", "Ruby",
  "Swift", "Kotlin", "Flutter", "React Native",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST", "gRPC",
  "Git", "Linux", "Bash", "Figma", "Tailwind", "CSS", "HTML",
  "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "SQL",
  "Agile", "Scrum", "Jira", "Jest", "Cypress", "Playwright",
];

function extractSkills(apps: RawApplication[]): { skill: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const app of apps) {
    if (!app.job_description) continue;
    const jd = app.job_description.toLowerCase();
    for (const skill of SKILL_KEYWORDS) {
      const pattern = new RegExp(`\\b${skill.replace(/\./g, "\\.").replace(/\+/g, "\\+")}\\b`, "i");
      if (pattern.test(jd)) {
        counts.set(skill, (counts.get(skill) ?? 0) + 1);
      }
    }
  }
  return Array.from(counts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function normalizePosition(position: string): string {
  return position
    .toLowerCase()
    .replace(/^(senior|junior|lead|staff|principal|associate|mid[-\s]?level|entry[\s-]?level|sr\.?|jr\.?)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTopRoles(apps: RawApplication[]): { role: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const app of apps) {
    const norm = normalizePosition(app.position);
    if (norm) counts.set(norm, (counts.get(norm) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([role, count]) => ({ role: role.charAt(0).toUpperCase() + role.slice(1), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

const BAR_COLORS = [
  "#818cf8", "#a78bfa", "#c084fc", "#f472b6",
  "#fb923c", "#fbbf24", "#34d399", "#60a5fa",
  "#f87171", "#94a3b8",
];

interface ChartProps {
  data: { name: string; count: number }[];
  label: string;
  color?: string;
}

function HorizontalBar({ data, label }: ChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-56 animate-pulse rounded-lg bg-muted/50" />;
  if (data.length === 0)
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 36, 140)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
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
          cursor={{ fill: "hsl(var(--muted)/0.3)" }}
        />
        <Bar dataKey="count" name={label} radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface Props {
  apps: RawApplication[];
}

export function TopCharts({ apps }: Props) {
  const roles = useMemo(
    () => extractTopRoles(apps).map((r) => ({ name: r.role, count: r.count })),
    [apps]
  );
  const skills = useMemo(
    () => extractSkills(apps).map((s) => ({ name: s.skill, count: s.count })),
    [apps]
  );

  return (
    <>
      {/* Most Applied Roles */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Most Applied Roles</h3>
          <p className="text-xs text-muted-foreground">Top positions by application count</p>
        </div>
        <HorizontalBar data={roles} label="Applications" />
      </div>

      {/* Most Requested Skills */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Most Requested Skills</h3>
          <p className="text-xs text-muted-foreground">
            Skills found in job descriptions
            {apps.filter((a) => a.job_description).length === 0 && " — add job descriptions to see results"}
          </p>
        </div>
        <HorizontalBar data={skills} label="Mentions" />
      </div>
    </>
  );
}
