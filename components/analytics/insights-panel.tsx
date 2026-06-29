"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import type { RawApplication, RawAnalysis, RawResume } from "@/types/analytics";

const SKILL_KEYWORDS = [
  "React", "TypeScript", "JavaScript", "Next.js", "Node.js", "Python", "Java",
  "Vue.js", "Angular", "Go", "Rust", "AWS", "Azure", "GCP", "Docker",
  "PostgreSQL", "MongoDB", "GraphQL", "Git", "Figma", "Tailwind",
];

function normalizePosition(p: string) {
  return p
    .toLowerCase()
    .replace(/^(senior|junior|lead|staff|principal|associate|sr\.?|jr\.?)\s+/i, "")
    .trim();
}

function topEntry<T>(map: Map<string, T extends number ? T : never>): string | null {
  if (map.size === 0) return null;
  return Array.from(map.entries()).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
}

interface Props {
  apps: RawApplication[];
  analyses: RawAnalysis[];
  resumes: RawResume[];
}

export function InsightsPanel({ apps, analyses, resumes }: Props) {
  const insights = useMemo((): string[] => {
    if (apps.length === 0) return ["Add your first job application to start seeing insights."];
    const results: string[] = [];

    // Interview rate
    const interviewApps = apps.filter((a) =>
      ["HR Interview", "Technical Interview", "Final Interview", "Offer", "Accepted"].includes(a.status)
    ).length;
    const appliedCount = apps.filter((a) => a.status !== "Wishlist").length;
    if (appliedCount > 0) {
      const rate = Math.round((interviewApps / appliedCount) * 100);
      results.push(`Your interview rate is ${rate}% (${interviewApps} of ${appliedCount} applied).`);
    }

    // Offer rate
    const offerCount = apps.filter((a) => ["Offer", "Accepted"].includes(a.status)).length;
    if (appliedCount > 0 && offerCount > 0) {
      const rate = Math.round((offerCount / appliedCount) * 100);
      results.push(`Offer rate is ${rate}% — you've received ${offerCount} offer${offerCount > 1 ? "s" : ""}.`);
    }

    // Most applied role
    const roleCounts = new Map<string, number>();
    for (const a of apps) {
      const r = normalizePosition(a.position);
      if (r) roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1);
    }
    const topRole = topEntry(roleCounts as any);
    if (topRole) {
      const count = roleCounts.get(topRole)!;
      results.push(`Most of your applications are for "${topRole.charAt(0).toUpperCase() + topRole.slice(1)}" (${count} applications).`);
    }

    // Best resume by ATS
    if (analyses.length > 0 && resumes.length > 0) {
      const resumeMap = new Map(resumes.map((r) => [r.id, r.display_name]));
      const byResume = new Map<string, number[]>();
      for (const a of analyses) {
        if (!a.resume_id) continue;
        const list = byResume.get(a.resume_id) ?? [];
        list.push(a.ats_score);
        byResume.set(a.resume_id, list);
      }
      let bestId = "";
      let bestAvg = 0;
      for (const [id, scores] of byResume) {
        const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
        if (avg > bestAvg) { bestAvg = avg; bestId = id; }
      }
      if (bestId && resumeMap.has(bestId)) {
        results.push(`"${resumeMap.get(bestId)}" has the highest average ATS score (${Math.round(bestAvg)}%).`);
      }

      // Average ATS across all analyses
      const allScores = analyses.map((a) => a.ats_score);
      const avgAts = Math.round(allScores.reduce((s, n) => s + n, 0) / allScores.length);
      results.push(`Your average ATS score across all analyses is ${avgAts}%.`);
    }

    // Top skill
    const skillCounts = new Map<string, number>();
    for (const app of apps) {
      if (!app.job_description) continue;
      for (const skill of SKILL_KEYWORDS) {
        const pattern = new RegExp(`\\b${skill.replace(/\./g, "\\.").replace(/\+/g, "\\+")}\\b`, "i");
        if (pattern.test(app.job_description)) {
          skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
        }
      }
    }
    if (skillCounts.size > 0) {
      const topSkill = topEntry(skillCounts as any);
      if (topSkill) results.push(`Most requested skill in your job descriptions: ${topSkill}.`);
    }

    // Active pipeline
    const active = apps.filter((a) =>
      ["Applied", "Assessment", "HR Interview", "Technical Interview", "Final Interview"].includes(a.status)
    ).length;
    if (active > 0) {
      results.push(`You have ${active} active application${active > 1 ? "s" : ""} in your pipeline right now.`);
    }

    // Response rate
    const responded = apps.filter((a) =>
      ["Assessment", "HR Interview", "Technical Interview", "Final Interview",
       "Offer", "Accepted", "Rejected", "Ghosted", "Withdrawn"].includes(a.status)
    ).length;
    if (appliedCount > 0) {
      const rate = Math.round((responded / appliedCount) * 100);
      results.push(`Overall response rate: ${rate}% of submitted applications received a response.`);
    }

    // Streak: days since last application
    if (apps.length > 0) {
      const lastApp = apps.slice().sort((a, b) => b.date_applied.localeCompare(a.date_applied))[0];
      const days = Math.floor((Date.now() - new Date(lastApp.date_applied).getTime()) / 86400000);
      if (days === 0) results.push("You applied to a job today — keep up the momentum!");
      else if (days <= 7) results.push(`Last application was ${days} day${days > 1 ? "s" : ""} ago.`);
      else results.push(`It's been ${days} days since your last application — time to apply again?`);
    }

    return results;
  }, [apps, analyses, resumes]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-400/10">
          <Lightbulb className="size-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Insights</h3>
          <p className="text-xs text-muted-foreground">Auto-generated from your data</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
